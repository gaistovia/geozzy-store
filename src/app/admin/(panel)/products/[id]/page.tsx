import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Checkbox, FormSection } from "@/components/admin/fields";
import { ProductImageUploader } from "@/components/admin/image-uploads";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireStaff } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import {
  addVariantAction,
  deleteProductAction,
  deleteVariantAction,
  duplicateProductAction,
  moveImageAction,
  recordImageAction,
  removeImageAction,
  setPrimaryImageAction,
  setStatusAction,
  updateImageAltAction,
  updateProductAction,
  updateVariantAction,
} from "../actions";
import { ProductForm, type ProductRow } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const [productRes, categoriesRes, imagesRes, variantsRes, settingRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name_en").order("sort_order"),
    supabase.from("product_images").select("id, storage_path, alt, position, is_primary").eq("product_id", id).order("position"),
    supabase.from("product_variants").select("id, size, color, stock_quantity, is_active, sort_order").eq("product_id", id).order("sort_order"),
    supabase.from("store_settings").select("value").eq("key", "low_stock_threshold").maybeSingle(),
  ]);
  const product = productRes.data as (ProductRow & { slug: string }) | null;
  if (!product) notFound();

  const images = imagesRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const threshold = typeof settingRes.data?.value === "number" ? settingRes.data.value : 3;
  const returnTo = `/admin/products/${id}`;
  const published = product.status === "published";

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "All products" }}
        actions={
          <>
            <Badge tone={published ? "success" : "neutral"}>{product.status}</Badge>
            {published && (
              <Link href={`/product/${product.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View on website
              </Link>
            )}
          </>
        }
      />
      <Flash searchParams={sp} />

      <ProductForm mode="edit" product={product} categories={categoriesRes.data ?? []} action={updateProductAction.bind(null, id)} />

      {/* Photos */}
      <FormSection title="Photos" hint="The first photo (marked Main) is shown on cards and in search results.">
        {images.length === 0 && <p className="text-sm text-muted-foreground">No photos yet. A product without photos shows a placeholder.</p>}
        <ul className="space-y-3">
          {images.map((img, i) => {
            const url = mediaUrl(img.storage_path);
            return (
              <li key={img.id} className="flex flex-wrap items-start gap-4 rounded-xl border border-border p-3">
                <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {url && <img src={url} alt={img.alt ?? ""} className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {img.is_primary && <Badge tone="gold">Main photo</Badge>}
                  <ActionForm action={updateImageAltAction.bind(null, img.id)} submitLabel="Save text" pendingLabel="Saving..." variant="outline" className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`alt-${img.id}`}>Photo description</label>
                    <Input id={`alt-${img.id}`} name="alt" defaultValue={img.alt ?? ""} maxLength={200} placeholder="Describe the photo (helps Google and screen readers)" className="min-w-0 flex-1" />
                  </ActionForm>
                  <div className="flex flex-wrap gap-1.5">
                    {!img.is_primary && (
                      <form action={setPrimaryImageAction}>
                        <input type="hidden" name="id" value={img.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <Button type="submit" size="sm" variant="outline">Make main</Button>
                      </form>
                    )}
                    {i > 0 && (
                      <form action={moveImageAction}>
                        <input type="hidden" name="id" value={img.id} />
                        <input type="hidden" name="direction" value="up" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <Button type="submit" size="sm" variant="ghost" aria-label="Move earlier">Move up</Button>
                      </form>
                    )}
                    {i < images.length - 1 && (
                      <form action={moveImageAction}>
                        <input type="hidden" name="id" value={img.id} />
                        <input type="hidden" name="direction" value="down" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <Button type="submit" size="sm" variant="ghost" aria-label="Move later">Move down</Button>
                      </form>
                    )}
                    <form action={removeImageAction}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <ConfirmButton size="sm" variant="ghost" className="text-danger" message="Delete this photo?">Delete</ConfirmButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <ProductImageUploader productId={id} record={recordImageAction} />
      </FormSection>

      {/* Sizes / stock */}
      <FormSection title="Sizes, colors and stock" hint={`Customers can only choose options that are active and in stock. Low-stock warning appears at ${threshold} or fewer.`}>
        {variants.length === 0 && <p className="text-sm text-danger">This product has no options, so customers cannot order it. Add at least one below (use &ldquo;One Size&rdquo; for a single option).</p>}
        <ul className="space-y-2">
          {variants.map((v) => (
            <li key={v.id} className="rounded-xl border border-border p-3">
              <ActionForm action={updateVariantAction.bind(null, v.id)} submitLabel="Save" variant="outline" className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_6rem_auto_auto]">
                <div>
                  <label htmlFor={`size-${v.id}`} className="mb-1 block text-xs text-muted-foreground">Size</label>
                  <Input id={`size-${v.id}`} name="size" defaultValue={v.size ?? ""} maxLength={40} />
                </div>
                <div>
                  <label htmlFor={`color-${v.id}`} className="mb-1 block text-xs text-muted-foreground">Color</label>
                  <Input id={`color-${v.id}`} name="color" defaultValue={v.color ?? ""} maxLength={40} />
                </div>
                <div>
                  <label htmlFor={`stock-${v.id}`} className="mb-1 block text-xs text-muted-foreground">Stock</label>
                  <Input id={`stock-${v.id}`} name="stock_quantity" inputMode="numeric" defaultValue={v.stock_quantity} />
                </div>
                <Checkbox name="is_active" label="Active" defaultChecked={v.is_active} />
              </ActionForm>
              <form action={deleteVariantAction} className="mt-2">
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <ConfirmButton size="sm" variant="ghost" className="text-danger" message="Delete this option?">Delete option</ConfirmButton>
              </form>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 text-sm font-medium">Add an option</p>
          <ActionForm action={addVariantAction.bind(null, id)} submitLabel="Add option" variant="secondary" resetOnSuccess className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_6rem_auto_auto]">
            <div>
              <label htmlFor="new-size" className="mb-1 block text-xs text-muted-foreground">Size</label>
              <Input id="new-size" name="size" maxLength={40} placeholder="e.g. 44" />
            </div>
            <div>
              <label htmlFor="new-color" className="mb-1 block text-xs text-muted-foreground">Color</label>
              <Input id="new-color" name="color" maxLength={40} placeholder="optional" />
            </div>
            <div>
              <label htmlFor="new-stock" className="mb-1 block text-xs text-muted-foreground">Stock</label>
              <Input id="new-stock" name="stock_quantity" inputMode="numeric" defaultValue="0" />
            </div>
            <Checkbox name="is_active" label="Active" defaultChecked />
          </ActionForm>
        </div>
      </FormSection>

      {/* Danger zone */}
      <Card className="space-y-4 p-5">
        <h2 className="font-display text-xl font-semibold">Other actions</h2>
        <div className="flex flex-wrap gap-3">
          <form action={duplicateProductAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" variant="outline">Duplicate (as a draft)</Button>
          </form>
          <form action={setStatusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="status" value={product.status === "archived" ? "draft" : "archived"} />
            <Button type="submit" variant="outline">{product.status === "archived" ? "Restore from archive" : "Archive"}</Button>
          </form>
          {profile.role === "admin" ? (
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={id} />
              <ConfirmButton variant="danger" message={`Delete "${product.name}" and all its photos? This cannot be undone.`}>Delete product</ConfirmButton>
            </form>
          ) : (
            <p className="self-center text-sm text-muted-foreground">Only an administrator can delete products. You can archive it instead.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
