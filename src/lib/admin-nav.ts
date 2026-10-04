export interface AdminNavItem {
  href: string;
  label: string;
  /** Hidden from staff; only administrators see it. */
  adminOnly?: boolean;
}

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Order enquiries" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/settings", label: "Store settings", adminOnly: true },
];
