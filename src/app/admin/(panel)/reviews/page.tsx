import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Checkbox, Field, FormSection, Select, Textarea, TwoCol } from "@/components/admin/fields";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { addReviewAction, deleteReviewAction, reviewStatusAction } from "./actions";

export const metadata: Metadata = { title: "Reviews" };
const TONES: Record<string, BadgeTone> = { pending: "gold", approved: "success", rejected: "danger", hidden: "neutral" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filter = ["pending", "approved", "rejected", "hidden"].includes(one(sp.status) ?? "") ? one(sp.status)! : "";
  const supabase = await createClient();
  let query = supabase.from("reviews").select("id, reviewer_name, rating, body, status, is_verified_purchase, created_at, product:products(name)").order("created_at", { ascending: false }).limit(100);
  if (filter) query = query.eq("status", filter);
  const [{ data: reviews, error }, { data: products }] = await Promise.all([query, supabase.from("products").select("id, name").order("name")]);

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Reviews"
        description="Only approved reviews appear on product pages. The website never creates reviews. Add reviews that customers really sent you (for example on WhatsApp), with their permission."
      />
      <Flash searchParams={sp} />

      <form method="get" className="flex items-end gap-3">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">Show</label>
          <select id="status" name="status" defaultValue={filter} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
      </form>

      {error ? (
        <p className="text-danger">Could not load reviews: {error.message}</p>
      ) : !reviews || reviews.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No reviews yet.</Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const product = Array.isArray(r.product) ? r.product[0] : r.product;
            return (
              <li key={r.id}>
                <Card className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {r.reviewer_name} <span className="text-gold-600" aria-label={`${r.rating} out of 5`}>{"\u2605".repeat(r.rating)}{"\u2606".repeat(5 - r.rating)}</span>
                    </p>
                    <div className="flex gap-1.5">
                      {r.is_verified_purchase && <Badge tone="success">verified purchase</Badge>}
                      <Badge tone={TONES[r.status] ?? "neutral"}>{r.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm">{r.body}</p>
                  <p className="text-xs text-muted-foreground">{product?.name ?? "No product"} &middot; {formatDateTime(r.created_at)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["approved", "rejected", "hidden", "pending"] as const).filter((s) => s !== r.status).map((s) => (
                      <form key={s} action={reviewStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={s} />
                        <input type="hidden" name="returnTo" value="/admin/reviews" />
                        <Button type="submit" size="sm" variant={s === "approved" ? "primary" : "outline"}>{s === "approved" ? "Approve" : s === "rejected" ? "Reject" : s === "hidden" ? "Hide" : "Back to pending"}</Button>
                      </form>
                    ))}
                    <form action={deleteReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="returnTo" value="/admin/reviews" />
                      <ConfirmButton size="sm" variant="ghost" className="text-danger" message="Delete this review permanently?">Delete</ConfirmButton>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <FormSection title="Add a review you received" hint="Added as Pending. Check it, then press Approve.">
        <ActionForm action={addReviewAction} submitLabel="Add review" resetOnSuccess>
          <TwoCol>
            <Field label="Customer name" htmlFor="reviewer_name"><Input id="reviewer_name" name="reviewer_name" required maxLength={80} /></Field>
            <Field label="Rating (1 to 5)" htmlFor="rating">
              <Select id="rating" name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
          </TwoCol>
          <Field label="Product" htmlFor="product_id">
            <Select id="product_id" name="product_id" required defaultValue="">
              <option value="" disabled>Choose a product...</option>
              {(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Review text" htmlFor="body"><Textarea id="body" name="body" required rows={4} maxLength={2000} /></Field>
          <Checkbox name="is_verified_purchase" label="This customer bought the product from us" />
        </ActionForm>
      </FormSection>
    </div>
  );
}
