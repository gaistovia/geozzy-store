import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDateTime, formatTZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

interface Stat {
  label: string;
  value: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: thresholdRow } = await supabase.from("store_settings").select("value").eq("key", "low_stock_threshold").maybeSingle();
  const threshold = typeof thresholdRow?.value === "number" ? thresholdRow.value : 3;
  const lowStock = await supabase
    .from("product_listing")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gt("total_stock", 0)
    .lte("total_stock", threshold);

  const countProducts = (status?: "draft" | "published" | "archived") => {
    let q = supabase.from("products").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    return q;
  };

  const [
    total,
    published,
    drafts,
    outOfStock,
    categories,
    newEnquiries,
    recentOrders,
    recentProducts,
  ] = await Promise.all([
    countProducts(),
    countProducts("published"),
    countProducts("draft"),
    supabase
      .from("product_listing")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("in_stock", false),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "new_enquiry"),
    supabase
      .from("orders")
      .select("id, reference, status, estimated_total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, name, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [lowStock, total, published, drafts, outOfStock, categories, newEnquiries, recentOrders, recentProducts].find(
    (r) => r.error,
  );

  if (failed?.error) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
        <Card className="mt-6 border-danger/40">
          <CardBody>
            <p className="font-medium text-danger">The database is not ready.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run the four SQL files in <code>supabase/migrations</code> in order (see the README),
              then reload this page.
            </p>
            <p className="mt-3 break-words text-xs text-muted-foreground">
              Details: {failed.error.message}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const stats: Stat[] = [
    { label: "Products", value: total.count ?? 0 },
    { label: "Published", value: published.count ?? 0 },
    { label: "Drafts", value: drafts.count ?? 0 },
    { label: "Out of stock", value: outOfStock.count ?? 0 },
    { label: "Low stock", value: lowStock.count ?? 0 },
    { label: "Categories", value: categories.count ?? 0 },
    { label: "New enquiries", value: newEnquiries.count ?? 0 },
  ];

  const orders = recentOrders.data ?? [];
  const products = recentProducts.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>Add product</Link>
          <Link href="/admin/orders" className={buttonVariants({ size: "sm", variant: "outline" })}>View enquiries</Link>
          <Link href="/" target="_blank" className={buttonVariants({ size: "sm", variant: "outline" })}>View website</Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-4 py-3">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Recent order enquiries</h2>
          </CardHeader>
          <CardBody>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No enquiries yet. They appear here when a customer taps Order via WhatsApp.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.reference}</Link>
                      <p className="text-muted-foreground">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p>{formatTZS(order.estimated_total)}</p>
                      <Badge>{String(order.status).replaceAll("_", " ")}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Recently updated products</h2>
          </CardHeader>
          <CardBody>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products yet. Add your first product, or run the Blogger import (see the README).
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link href={`/admin/products/${product.id}`} className="block truncate font-medium hover:underline">{product.name}</Link>
                      <p className="text-muted-foreground">{formatDateTime(product.updated_at)}</p>
                    </div>
                    <Badge tone={product.status === "published" ? "success" : "neutral"}>
                      {product.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
