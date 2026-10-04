import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { Field, Select, Textarea } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ORDER_STATUSES } from "@/lib/admin/schemas";
import { formatDateTime, formatTZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { updateOrderAction } from "../actions";
import { STATUS_LABELS, STATUS_TONES } from "../status";

export const metadata: Metadata = { title: "Enquiry" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: order }, { data: items }, { data: events }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, product_id, product_name, size, color, unit_price, quantity, line_total").eq("order_id", id),
    supabase.from("order_events").select("id, from_status, to_status, created_at").eq("order_id", id).order("created_at"),
  ]);
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={order.reference}
        back={{ href: "/admin/orders", label: "All enquiries" }}
        actions={<Badge tone={STATUS_TONES[order.status] ?? "neutral"}>{STATUS_LABELS[order.status] ?? order.status}</Badge>}
      />

      <Card>
        <CardHeader><h2 className="font-semibold">What the customer prepared</h2></CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Customer tapped Order via WhatsApp on {formatDateTime(order.whatsapp_clicked_at)} (from {order.source === "cart" ? "the cart" : "a product page"}).
            Look for the message with reference <strong className="text-foreground">{order.reference}</strong> in WhatsApp.
          </p>
          <ul className="divide-y divide-border">
            {(items ?? []).map((i) => (
              <li key={i.id} className="flex flex-wrap justify-between gap-3 py-2.5 text-sm">
                <div>
                  {i.product_id ? <Link href={`/admin/products/${i.product_id}`} className="font-medium hover:underline">{i.product_name}</Link> : <span className="font-medium">{i.product_name}</span>}
                  <p className="text-muted-foreground">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" / ")} &times; {i.quantity} @ {formatTZS(i.unit_price)}</p>
                </div>
                <span className="tabular-nums">{formatTZS(i.line_total)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Estimated product total</span>
            <span className="tabular-nums">{formatTZS(order.estimated_total)}</span>
          </p>
          <p className="text-xs text-muted-foreground">Prices were taken from the shop at the time. Delivery is not included. Final prices are agreed on WhatsApp.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Update status</h2></CardHeader>
        <CardBody>
          <ActionForm action={updateOrderAction.bind(null, id)} submitLabel="Save status">
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </Field>
            <Field label="Private notes" htmlFor="notes" hint="Only staff can see this.">
              <Textarea id="notes" name="notes" rows={4} maxLength={2000} defaultValue={order.notes ?? ""} />
            </Field>
          </ActionForm>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">History</h2></CardHeader>
        <CardBody>
          <ol className="space-y-2 text-sm">
            {(events ?? []).map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2">
                <span>{e.from_status ? `${STATUS_LABELS[e.from_status] ?? e.from_status} \u2192 ` : ""}<strong>{STATUS_LABELS[e.to_status] ?? e.to_status}</strong></span>
                <span className="text-muted-foreground">{formatDateTime(e.created_at)}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
