import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, FormSection, Select, Textarea, TwoCol } from "@/components/admin/fields";
import { NameSlugFields } from "@/components/admin/name-slug-fields";
import { Input } from "@/components/ui/input";
import { specificationsToText } from "@/lib/admin/schemas";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  sku: string | null;
  category_id: string | null;
  short_description_sw: string | null;
  short_description_en: string | null;
  description_sw: string | null;
  description_en: string | null;
  regular_price: number;
  sale_price: number | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_new: boolean;
  is_promotional: boolean;
  specifications: unknown;
  video_url: string | null;
}

export function ProductForm({
  product,
  categories,
  action,
  mode,
}: {
  product?: ProductRow;
  categories: { id: string; name_en: string }[];
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string; message?: string } | void>;
  mode: "create" | "edit";
}) {
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Create product" : "Save changes"} className="space-y-6">
      <FormSection title="Basic information">
        <NameSlugFields
          initialName={product?.name}
          initialSlug={product?.slug}
          nameLabel="Product name"
          slugHint="Used in the page link: /product/your-slug. Changing it after launch breaks old links, so avoid editing it later."
          autoFollow={mode === "create"}
        />
        <TwoCol>
          <Field label="Brand" htmlFor="brand">
            <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} maxLength={80} />
          </Field>
          <Field label="SKU (product code)" htmlFor="sku" hint="Optional. Must be unique.">
            <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} maxLength={60} />
          </Field>
        </TwoCol>
        <Field label="Category" htmlFor="category_id" hint="Required before a product can be published.">
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Description" hint="Fill in both languages when you can. If one is empty, the other is shown.">
        <TwoCol>
          <Field label="Short description (Kiswahili)" htmlFor="short_description_sw">
            <Textarea id="short_description_sw" name="short_description_sw" rows={2} maxLength={400} defaultValue={product?.short_description_sw ?? ""} />
          </Field>
          <Field label="Short description (English)" htmlFor="short_description_en">
            <Textarea id="short_description_en" name="short_description_en" rows={2} maxLength={400} defaultValue={product?.short_description_en ?? ""} />
          </Field>
          <Field label="Full description (Kiswahili)" htmlFor="description_sw">
            <Textarea id="description_sw" name="description_sw" rows={6} maxLength={5000} defaultValue={product?.description_sw ?? ""} />
          </Field>
          <Field label="Full description (English)" htmlFor="description_en">
            <Textarea id="description_en" name="description_en" rows={6} maxLength={5000} defaultValue={product?.description_en ?? ""} />
          </Field>
        </TwoCol>
        <Field label="Details / specifications" htmlFor="specifications" hint="One per line, like  Material: Leather  or  Sole: Rubber">
          <Textarea id="specifications" name="specifications" rows={4} defaultValue={specificationsToText(product?.specifications)} />
        </Field>
        <Field label="Video link (optional)" htmlFor="video_url" hint="Starts with https://">
          <Input id="video_url" name="video_url" type="url" defaultValue={product?.video_url ?? ""} maxLength={300} />
        </Field>
      </FormSection>

      <FormSection title="Pricing (TZS)" hint="Regular price is the original price. Add a sale price only if the product is discounted; the discount is worked out from your two prices.">
        <TwoCol>
          <Field label="Regular price" htmlFor="regular_price">
            <Input id="regular_price" name="regular_price" inputMode="numeric" required defaultValue={product?.regular_price ?? ""} />
          </Field>
          <Field label="Sale price (the price customers pay now)" htmlFor="sale_price" hint="Leave empty if there is no sale.">
            <Input id="sale_price" name="sale_price" inputMode="numeric" defaultValue={product?.sale_price ?? ""} />
          </Field>
        </TwoCol>
      </FormSection>

      {mode === "create" && (
        <FormSection title="Sizes and stock" hint="You can fine-tune each size on the next page.">
          <TwoCol>
            <Field label="Sizes" htmlFor="sizes" hint="A range like 40-45, or a list like S, M, L. Leave empty for a single 'One Size' option.">
              <Input id="sizes" name="sizes" placeholder="40-45" />
            </Field>
            <Field label="Stock for each size" htmlFor="initial_stock" hint="How many pairs you have of each size.">
              <Input id="initial_stock" name="initial_stock" inputMode="numeric" defaultValue="0" />
            </Field>
          </TwoCol>
        </FormSection>
      )}

      <FormSection title="Publishing">
        <Field label="Status" htmlFor="status" hint="Draft = hidden from customers. Published = visible in the shop. Archived = hidden, kept for your records.">
          <Select id="status" name="status" defaultValue={product?.status ?? "draft"}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (visible)</option>
            <option value="archived">Archived (hidden)</option>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Checkbox name="is_featured" label="Featured" hint="Shown on the homepage" defaultChecked={product?.is_featured} />
          <Checkbox name="is_new" label="New arrival" hint="Shown in New arrivals" defaultChecked={product?.is_new} />
          <Checkbox name="is_promotional" label="Promotional" hint="Marks it as part of a promotion" defaultChecked={product?.is_promotional} />
        </div>
      </FormSection>
    </ActionForm>
  );
}
