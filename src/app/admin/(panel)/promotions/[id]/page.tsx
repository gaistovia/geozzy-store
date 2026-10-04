import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Field, FormSection, Select } from "@/components/admin/fields";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatTZS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { deletePromotionAction, removePromotionProductAction, setPromotionProductAction, updatePromotionAction } from "../actions";
import { PromotionForm, type PromotionRow } from "../promotion-form";

export const metadata: Metadata = { title: "Edit promotion" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPromotionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: promotion }, { data: attached }, { data: allProducts }] = await Promise.all([
    supabase.from("promotions").select("*").eq("id", id).maybeSingle(),
    supabase.from("promotion_products").select("product_id, promo_price").eq("promotion_id", id),
    supabase.from("products").select("id, name, regular_price, sale_price, status").order("name"),
  ]);
  if (!promotion) notFound();

  const byId = new Map((allProducts ?? []).map((p) => [p.id, p]));
  const attachedIds = new Set((attached ?? []).map((a) => a.product_id));
  const available = (allProducts ?? []).filter((p) => !attachedIds.has(p.id) && p.status !== "archived");
  const returnTo = `/admin/promotions/${id}`;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title={promotion.name} back={{ href: "/admin/promotions", label: "All promotions" }} />
      <Flash searchParams={sp} />
      <PromotionForm mode="edit" promotion={promotion as PromotionRow} action={updatePromotionAction.bind(null, id)} />

      <FormSection title="Products in this promotion" hint="Set a promotion price to lower the price while the promotion is live. Leave it empty to just feature the product here without changing its price.">
        {(attached ?? []).length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
        <ul className="space-y-2">
          {(attached ?? []).map((a) => {
            const p = byId.get(a.product_id);
            if (!p) return null;
            return (
              <li key={a.product_id} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-medium">{p.name} <span className="font-normal text-muted-foreground">(now {formatTZS(p.sale_price ?? p.regular_price)}{p.status !== "published" ? `, ${p.status}` : ""})</span></p>
                <ActionForm action={setPromotionProductAction.bind(null, id)} submitLabel="Save price" variant="outline" className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="product_id" value={a.product_id} />
                  <Field label="Promotion price (TZS)" htmlFor={`pp-${a.product_id}`}>
                    <Input id={`pp-${a.product_id}`} name="promo_price" inputMode="numeric" defaultValue={a.promo_price ?? ""} className="w-44" />
                  </Field>
                </ActionForm>
                <form action={removePromotionProductAction} className="mt-2">
                  <input type="hidden" name="promotion_id" value={id} />
                  <input type="hidden" name="product_id" value={a.product_id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" size="sm" variant="ghost" className="text-danger">Remove from promotion</Button>
                </form>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 text-sm font-medium">Add a product</p>
          <ActionForm action={setPromotionProductAction.bind(null, id)} submitLabel="Add" variant="secondary" resetOnSuccess className="flex flex-wrap items-end gap-3">
            <Field label="Product" htmlFor="new-product">
              <Select id="new-product" name="product_id" required defaultValue="">
                <option value="" disabled>Choose a product...</option>
                {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Promotion price (optional)" htmlFor="new-price">
              <Input id="new-price" name="promo_price" inputMode="numeric" className="w-44" />
            </Field>
          </ActionForm>
        </div>
      </FormSection>

      <Card className="p-5">
        <form action={deletePromotionAction}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton variant="danger" message={`Delete the promotion "${promotion.name}"? Products stay; only the promotion and its prices are removed.`}>Delete promotion</ConfirmButton>
        </form>
      </Card>
    </div>
  );
}
