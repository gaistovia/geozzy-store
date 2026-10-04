import type { MetadataRoute } from "next";
import { allowIndexing, getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  if (!allowIndexing()) {
    // Temporary address: keep everything out of search engines until launch.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/cart"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
