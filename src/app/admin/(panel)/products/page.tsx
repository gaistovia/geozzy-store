import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { formatTZS } from "@/lib/format";
import { sanitizeSearch } from "@/lib/list-params";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { duplicateProductAction, deleteProductAction, setStatusAction } from "./actions";

export const metadata: Metadata = { title: "Products" };
const PAGE_SIZE = 20;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { profile } = await requireStaff();
  const sp = await searchParams;
  const q = sanitizeSearch(one(sp.q) ?? "");
  const status = ["draft", "published", "archived"].includes(one(sp.status) ?? "") ? one(sp.status)! : "";
  const category = /^[a-z0-9-]{1,80}$/.test(one(sp.category) ?? "") ? one(sp.category)! : "";
  const stock = one(sp.stock) === "out" ? "out" : one(sp.stock) === "low" ? "low" : "";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: settingRow } = await supabase.from("store_settings").select("value").eq("key", "low_stock_threshold").maybeSingle();
  const threshold = typeof settingRow?.value === "number" ? settingRow.value : 3;

  let query = supabase
    .from("product_listing")
    .select("id, slug, name, category_name_en, regular_price, current_price, status, is_featured, is_new, total_stock, primary_image_path, updated_at", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category_slug", category);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`);
  if (stock === "out") query = query.eq("total_stock", 0);
  if (stock === "low") query = query.gt("total_stock", 0).lte("total_stock", threshold);
  const from = (page - 1) * PAGE_SIZE;
  const [{ data: products, count, error }, { data: categories }] = await Promise.all([
    query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1),
    supabase.from("categories").select("slug, name_en").order("sort_order"),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (stock) params.set("stock", stock);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };
  const returnTo = "/admin/products";
  const selectClass = "h-10 rounded-lg border border-border bg-card px-3 text-sm";

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${count ?? 0} product${count === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({})}>
            Add product
          </Link>
        }
      />
      <Flash searchParams={sp} />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, brand or SKU" className="h-10 w-56 rounded-lg border border-border bg-card px-3 text-sm" />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select id="status" name="status" defaultValue={status} className={selectClass}>
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
          <select id="category" name="category" defaultValue={category} className={selectClass}>
            <option value="">All</option>
            {(categories ?? []).map((c) => (
              <option key={c.slug} value={c.slug}>{c.name_en}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stock" className="mb-1 block text-xs font-medium text-muted-foreground">Stock</label>
          <select id="stock" name="stock" defaultValue={stock} className={selectClass}>
            <option value="">All</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        <Link href="/admin/products" className="pb-2 text-sm text-muted-foreground underline underline-offset-4">Clear</Link>
      </form>

      {error ? (
        <p className="text-danger">Could not load products: {error.message}</p>
      ) : !products || products.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No products match. {count === 0 && !q && !status && !category ? "Add your first product, or run the Blogger import." : ""}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const img = mediaUrl(p.primary_image_path);
                const published = p.status === "published";
                return (
                  <tr key={p.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {img && <img src={img} alt="" className="size-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                          <p className="text-xs text-muted-foreground">{p.category_name_en ?? "No category"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatTZS(p.current_price)}
                      {p.regular_price > p.current_price && <span className="block text-xs text-muted-foreground line-through">{formatTZS(p.regular_price)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.total_stock === 0 ? <Badge tone="danger">Out of stock</Badge> : p.total_stock <= threshold ? <Badge tone="gold">Low: {p.total_stock}</Badge> : <span className="tabular-nums">{p.total_stock}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={published ? "success" : "neutral"}>{p.status}</Badge>
                      {p.is_featured && <Badge tone="gold" className="ml-1">featured</Badge>}
                      {p.is_new && <Badge tone="gold" className="ml-1">new</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link href={`/admin/products/${p.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>
                        <form action={setStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <input type="hidden" name="status" value={published ? "draft" : "published"} />
                          <Button type="submit" variant="ghost" size="sm">{published ? "Unpublish" : "Publish"}</Button>
                        </form>
                        <form action={duplicateProductAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" variant="ghost" size="sm">Duplicate</Button>
                        </form>
                        {profile.role === "admin" && (
                          <form action={deleteProductAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton variant="ghost" size="sm" className="text-danger" message={`Delete "${p.name}" and all its photos? This cannot be undone.`}>Delete</ConfirmButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={hrefFor(page - 1)}>Previous</Link>}
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={hrefFor(page + 1)}>Next</Link>}
        </nav>
      )}
    </div>
  );
}
