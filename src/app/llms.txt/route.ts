import { getCategories, getLivePromotions } from "@/lib/data/catalog";
import { getStoreSettings, pick } from "@/lib/data/settings";
import { getSiteUrl } from "@/lib/env";
import { t } from "@/lib/i18n/text";

export const revalidate = 3600;

/**
 * Plain-text summary for AI assistants and answer engines (llms.txt convention).
 * Built only from real store data. It is a helpful hint, not a ranking guarantee.
 */
export async function GET() {
  const base = getSiteUrl();
  const [settings, categories, promotions] = await Promise.all([getStoreSettings(), getCategories(), getLivePromotions()]);
  const hours = pick(settings.businessHours, "en");

  const lines = [
    `# ${settings.storeName}`,
    "",
    "> Online store in Tanzania selling shoes (sneakers, formal shoes, sandals, ladies' shoes) and stylish watches. " +
      "Customers browse the website, choose a size, and place the order on WhatsApp. There is no online payment on the website: " +
      "availability, delivery and payment are arranged with the store on WhatsApp.",
    "",
    "Languages: Kiswahili (default) and English. Currency: Tanzanian shillings (TZS).",
    "",
    "## Main pages",
    `- [Shop all products](${base}/shop): full catalogue with search, category, price and availability filters`,
    `- [New arrivals](${base}/new-arrivals): the latest products added`,
    ...(promotions.length > 0 ? [`- [Offers](${base}/offers): current promotions`] : []),
    `- [FAQ](${base}/faq): how to order, sizes, delivery, payment and returns`,
    `- [About](${base}/about)`,
    `- [Contact](${base}/contact)`,
    `- [English version](${base}/en)`,
    "",
    ...(categories.length > 0
      ? ["## Categories", ...categories.map((c) => `- [${t("en", c.name_sw, c.name_en)}](${base}/category/${c.slug})`), ""]
      : []),
    "## How to order",
    "1. Open a product page and choose your size.",
    "2. Tap \"Order via WhatsApp\" (or add several items to the cart first).",
    "3. Send the pre-filled WhatsApp message. The store confirms availability, delivery and payment on WhatsApp.",
    "",
    "## Contact",
    `- WhatsApp: +${settings.whatsappNumber}`,
    ...(settings.email ? [`- Email: ${settings.email}`] : []),
    ...(settings.address ? [`- Address: ${settings.address}`] : []),
    ...(hours ? [`- Opening hours: ${hours.replace(/\s*\n\s*/g, "; ")}`] : []),
    "",
    "## Policies",
    `- Returns: items can be returned within ${settings.returnPolicyDays} days; contact the store on WhatsApp for how it works.`,
    "- Payment is never taken on the website.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
