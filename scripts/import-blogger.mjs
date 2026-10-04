#!/usr/bin/env node
/**
 * One-time import of the old Blogger products into Supabase.
 *
 *   npm run import:blogger -- --dry-run     (preview only, changes nothing)
 *   npm run import:blogger                  (real import)
 *   npm run import:blogger -- --file feed.json   (use a saved copy of the feed)
 *
 * - Everything is imported as DRAFT. Nothing becomes public until you publish it in the admin.
 * - Safe to run again: products whose slug already exists are skipped.
 * - Signs in as YOUR admin user (ADMIN_EMAIL / ADMIN_PASSWORD in .env.local), so no secret keys are used.
 * - Images are downloaded from Blogger in full size and uploaded to Supabase Storage.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const BLOG = "https://geozzystore.blogspot.com";
const BUCKET = "store-media";
const PLACEHOLDER_STOCK = 10; // Blogger had no stock numbers - EDIT these in the admin.
const GENERIC_DESCRIPTION = /^hii kiatu unaipata popote ulipo/i;

/** Cleaner names for posts whose Blogger titles have typos or are just codes (keyed by Blogger post id). */
const NAME_OVERRIDES = {
  "6989590196942053138": "LV Sneaker Trainer (2)",
  "5603347118463362510": "LV Sneaker Trainer",
  "7488335845862783616": "LV Trainers",
  "6387073517052610979": "DB9668 Sandals",
  "6138880720875605571": "Black patent leather lug sole loafers",
};

const CATEGORY_MAP = {
  sandals: "sandals",
  sneakers: "sneakers",
  sneaker: "sneakers",
  "formal shoes": "formal-shoes",
  "ladies heels": "ladies",
  ladies: "ladies",
  sports: "sports",
  smartwatches: "smartwatches",
};

/* ------------------------------------------------------------------ parsing */

export function slugify(input) {
  return input
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 120).replace(/-+$/g, "");
}

const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function span(html, cls) {
  const m = new RegExp(`<span[^>]*class=["']${cls}["'][^>]*>([\\s\\S]*?)</span>`, "i").exec(html);
  return m ? decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : "";
}

const toPrice = (text) => {
  const m = /[\d][\d,\.]*/.exec(text || "");
  return m ? Number.parseInt(m[0].replace(/[,\.]/g, ""), 10) : null;
};

export function parseSizes(text) {
  const range = /^(\d{2})\s*[-–]\s*(\d{2})$/.exec((text || "").trim());
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    if (from <= to && to - from <= 30) return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  }
  const single = (text || "").trim();
  return single && single !== "--" ? [single] : ["One Size"];
}

/** Full-size, de-duplicated image URLs found in the post HTML (anchor links point to the originals). */
export function extractImages(html) {
  const found = [];
  const seen = new Set();
  const re = /href=["'](https:\/\/blogger\.googleusercontent\.com\/img\/[^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let url = decode(m[1]);
    url = /\/s\d+(-[a-z0-9]+)?\//.test(url)
      ? url.replace(/\/s\d+(-[a-z0-9]+)?\//, "/s1600/")
      : /=/.test(url) ? url : `${url}=s1600`;
    const key = url.replace(/\/s1600\//, "/").replace(/=s1600$/, "");
    if (!seen.has(key)) { seen.add(key); found.push(url); }
  }
  return found;
}

export function parsePost(entry) {
  const html = entry.content?.$t ?? "";
  const id = String(entry.id?.$t ?? "").split("post-").pop();
  const link = (entry.link ?? []).find((l) => l.rel === "alternate")?.href ?? "";
  const rawTitle = decode(entry.title?.$t ?? "").replace(/\s+/g, " ").trim();
  const cleaned = rawTitle.replace(/[\s.]+$/, "");
  const name = NAME_OVERRIDES[id] ?? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1));

  const price = toPrice(span(html, "price"));
  const oldPrice = toPrice(span(html, "oldprice"));
  const labels = (entry.category ?? []).map((c) => String(c.term).toLowerCase());
  const categoryRaw = span(html, "category").toLowerCase();
  const categorySlug = CATEGORY_MAP[categoryRaw] ?? labels.map((l) => CATEGORY_MAP[l]).find(Boolean) ?? null;

  let slug = decodeURIComponent(link.split("/").pop() ?? "").replace(/\.html$/, "");
  if (!slug || slug.startsWith("price-") || !/^[a-z0-9-]+$/.test(slug)) slug = slugify(name);

  const description = span(html, "description");
  const regular = oldPrice && price && oldPrice > price ? oldPrice : price;
  const sale = oldPrice && price && oldPrice > price ? price : null;

  return {
    bloggerId: id,
    name,
    slug,
    legacyUrl: link,
    categorySlug,
    regularPrice: regular,
    salePrice: sale,
    sizes: parseSizes(span(html, "size")),
    descriptionSw: description && !GENERIC_DESCRIPTION.test(description) ? description : null,
    isNew: labels.includes("new") || labels.includes("new arrivals"),
    images: extractImages(html),
  };
}

/* --------------------------------------------------------------------- main */

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function fetchFeed(fileArg) {
  if (fileArg) return JSON.parse(fs.readFileSync(fileArg, "utf8"));
  const entries = [];
  let start = 1;
  for (;;) {
    const res = await fetch(`${BLOG}/feeds/posts/default?alt=json&max-results=150&start-index=${start}`);
    if (!res.ok) throw new Error(`Could not read the Blogger feed (HTTP ${res.status}).`);
    const json = await res.json();
    const batch = json.feed?.entry ?? [];
    entries.push(...batch);
    if (batch.length < 150) break;
    start += 150;
  }
  return { feed: { entry: entries } };
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

  const feed = await fetchFeed(fileArg);
  const posts = (feed.feed?.entry ?? []).map(parsePost);
  console.log(`Found ${posts.length} products in the Blogger feed.\n`);

  const problems = [];
  for (const p of posts) {
    if (!p.regularPrice) problems.push(`${p.name}: no price found`);
    if (!p.categorySlug) problems.push(`${p.name}: category not recognised`);
    if (p.images.length === 0) problems.push(`${p.name}: no images found`);
  }

  if (dryRun) {
    for (const p of posts) {
      console.log(`- ${p.name}\n    slug: ${p.slug} | ${p.categorySlug} | regular ${p.regularPrice} | sale ${p.salePrice ?? "-"} | sizes ${p.sizes.join(",")} | ${p.images.length} image(s)${p.isNew ? " | NEW" : ""}`);
    }
    console.log(problems.length ? `\nThings to check:\n  ${problems.join("\n  ")}` : "\nNo problems found.");
    console.log("\nDry run only - nothing was changed.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!url || !anon || !email || !password) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first.");
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Admin sign-in failed: ${signInError.message}`);

  const { data: categories, error: catError } = await supabase.from("categories").select("id, slug");
  if (catError) throw new Error(`Could not read categories (did you run all 4 SQL files?): ${catError.message}`);
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));

  const { data: existing } = await supabase.from("products").select("slug");
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));

  let created = 0, skipped = 0, failed = 0;
  for (const p of posts) {
    if (existingSlugs.has(p.slug)) { console.log(`skip   ${p.slug} (already exists)`); skipped++; continue; }
    if (!p.regularPrice) { console.log(`FAIL   ${p.name}: no price`); failed++; continue; }
    try {
      const { data: product, error } = await supabase.from("products").insert({
        slug: p.slug, name: p.name, category_id: p.categorySlug ? categoryId.get(p.categorySlug) ?? null : null,
        regular_price: p.regularPrice, sale_price: p.salePrice, description_sw: p.descriptionSw,
        is_new: p.isNew, status: "draft", legacy_url: p.legacyUrl || null,
      }).select("id").single();
      if (error) throw new Error(error.message);

      const { error: vError } = await supabase.from("product_variants").insert(
        p.sizes.map((size, i) => ({ product_id: product.id, size, stock_quantity: PLACEHOLDER_STOCK, sort_order: i })),
      );
      if (vError) throw new Error(`sizes: ${vError.message}`);

      let uploaded = 0;
      for (const [i, imageUrl] of p.images.entries()) {
        const res = await fetch(imageUrl);
        const type = (res.headers.get("content-type") ?? "").split(";")[0];
        if (!res.ok || !/^image\/(jpeg|png|webp|avif)$/.test(type)) { console.log(`   image ${i + 1}: could not download (HTTP ${res.status}, ${type})`); continue; }
        const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];
        const path = `products/${p.slug}/${i + 1}.${ext}`;
        const { error: upError } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await res.arrayBuffer()), { contentType: type, upsert: true });
        if (upError) { console.log(`   image ${i + 1}: upload failed: ${upError.message}`); continue; }
        const { error: imgError } = await supabase.from("product_images").insert({
          product_id: product.id, storage_path: path, alt: p.name, position: uploaded, is_primary: uploaded === 0,
        });
        if (imgError) { console.log(`   image ${i + 1}: record failed: ${imgError.message}`); continue; }
        uploaded++;
      }
      console.log(`ok     ${p.slug} (${p.sizes.length} sizes, ${uploaded}/${p.images.length} images)`);
      created++;
    } catch (e) {
      console.log(`FAIL   ${p.slug}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone. Created ${created}, skipped ${skipped}, failed ${failed}. All created products are DRAFTS.`);
  if (failed) console.log("Run the command again to retry the failed ones.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(`\nImport stopped: ${e.message}`); process.exit(1); });
}
