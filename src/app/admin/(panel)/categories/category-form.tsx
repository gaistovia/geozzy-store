import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, FormSection, Textarea, TwoCol } from "@/components/admin/fields";
import { SingleImageField } from "@/components/admin/image-uploads";
import { NameSlugFields } from "@/components/admin/name-slug-fields";
import { Input } from "@/components/ui/input";

export interface CategoryRow {
  id: string;
  slug: string;
  name_sw: string;
  name_en: string;
  description_sw: string | null;
  description_en: string | null;
  image_path: string | null;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
}

export function CategoryForm({
  category,
  action,
  mode,
}: {
  category?: CategoryRow;
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string; message?: string } | void>;
  mode: "create" | "edit";
}) {
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Create category" : "Save changes"} className="space-y-6">
      <FormSection title="Category">
        <NameSlugFields
          initialName={category?.name_en}
          initialSlug={category?.slug}
          nameLabel="Name (English)"
          slugHint="Used in the page link: /category/your-slug."
          autoFollow={mode === "create"}
        />
        <Field label="Name (Kiswahili)" htmlFor="name_sw" hint="If empty, the English name is used.">
          <Input id="name_sw" name="name_sw" maxLength={80} defaultValue={category?.name_sw ?? ""} />
        </Field>
        <TwoCol>
          <Field label="Description (Kiswahili)" htmlFor="description_sw">
            <Textarea id="description_sw" name="description_sw" rows={3} maxLength={600} defaultValue={category?.description_sw ?? ""} />
          </Field>
          <Field label="Description (English)" htmlFor="description_en">
            <Textarea id="description_en" name="description_en" rows={3} maxLength={600} defaultValue={category?.description_en ?? ""} />
          </Field>
        </TwoCol>
        <SingleImageField name="image_path" folder="categories" initialPath={category?.image_path ?? null} label="Category image" hint="Shown on the homepage category tile." />
      </FormSection>
      <FormSection title="Display">
        <Field label="Sort order" htmlFor="sort_order" hint="Smaller numbers appear first.">
          <Input id="sort_order" name="sort_order" inputMode="numeric" defaultValue={category?.sort_order ?? 100} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox name="is_visible" label="Visible on the website" defaultChecked={category ? category.is_visible : true} />
          <Checkbox name="is_featured" label="Show on the homepage" defaultChecked={category?.is_featured} />
        </div>
      </FormSection>
    </ActionForm>
  );
}
