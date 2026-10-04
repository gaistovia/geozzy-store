import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ORDER_STATUSES } from "@/lib/admin/schemas";
import { formatDateTime, formatTZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_TONES } from "./status";

export const metadata: Metadata = { title: "Order enquiries" };
const PAGE_SIZE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = (ORDER_STATUSES as readonly string[]).includes(one(sp.status) ?? "") ? one(sp.status)! : "";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);
  const supabase = await createClient();

  let query = supabase.from("orders").select("id, reference, status, source, estimated_total, item_count, created_at", { count: "exact" });
  if (status) query = query.eq("status", status);
  const from = (page - 1) * PAGE_SIZE;
  const { data: orders, count, error } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;

  return (
    <div>
      <PageHeader title="Order enquiries" />
      <Card className="mb-6">
        <CardBody className="text-sm text-muted-foreground">
          An enquiry is saved when a customer taps <strong className="text-foreground">Order via WhatsApp</strong>. It shows what they prepared,
          but it does <strong className="text-foreground">not</strong> prove the WhatsApp message was sent or read, and it holds no name or phone number.
          The real order is the conversation on WhatsApp. Update the status here as you handle each one.
        </CardBody>
      </Card>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select id="status" name="status" defaultValue={status} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
      </form>

      {error ? (
        <p className="text-danger">Could not load enquiries: {error.message}</p>
      ) : !orders || orders.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No enquiries yet.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60">
              <div>
                <p className="font-medium">{o.reference}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)} &middot; {o.item_count} item(s) &middot; from {o.source === "cart" ? "cart" : "a product page"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{formatTZS(o.estimated_total)}</span>
                <Badge tone={STATUS_TONES[o.status] ?? "neutral"}>{STATUS_LABELS[o.status] ?? o.status}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={href(page - 1)}>Previous</Link>}
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={href(page + 1)}>Next</Link>}
        </nav>
      )}
    </div>
  );
}
