import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, FormSection, Textarea, TwoCol } from "@/components/admin/fields";
import { SingleImageField } from "@/components/admin/image-uploads";
import { NameSlugFields } from "@/components/admin/name-slug-fields";
import { Input } from "@/components/ui/input";
import { isoToEatInput } from "@/lib/admin/time";

export interface PromotionRow {
  id: string;
  slug: string;
  name: string;
  description_sw: string | null;
  description_en: string | null;
  banner_image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export function PromotionForm({
  promotion,
  action,
  mode,
}: {
  promotion?: PromotionRow;
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string; message?: string } | void>;
  mode: "create" | "edit";
}) {
  return (
    <ActionForm action={action} submitLabel={mode === "create" ? "Create promotion" : "Save changes"} className="space-y-6">
      <FormSection title="Promotion">
        <NameSlugFields initialName={promotion?.name} initialSlug={promotion?.slug} nameLabel="Name" slugHint="Internal address of the promotion." autoFollow={mode === "create"} />
        <TwoCol>
          <Field label="Description (Kiswahili)" htmlFor="description_sw">
            <Textarea id="description_sw" name="description_sw" rows={3} maxLength={600} defaultValue={promotion?.description_sw ?? ""} />
          </Field>
          <Field label="Description (English)" htmlFor="description_en">
            <Textarea id="description_en" name="description_en" rows={3} maxLength={600} defaultValue={promotion?.description_en ?? ""} />
          </Field>
        </TwoCol>
        <SingleImageField name="banner_image_path" folder="promotions" initialPath={promotion?.banner_image_path ?? null} label="Banner image" hint="Shown on the Offers page and the homepage banner. A wide image works best." />
      </FormSection>
      <FormSection title="When" hint="Times are in East Africa Time. Leave both empty to run it whenever it is switched on.">
        <TwoCol>
          <Field label="Starts" htmlFor="starts_at">
            <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={isoToEatInput(promotion?.starts_at)} />
          </Field>
          <Field label="Ends" htmlFor="ends_at">
            <Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={isoToEatInput(promotion?.ends_at)} />
          </Field>
        </TwoCol>
        <Checkbox name="is_active" label="Switched on" hint="Off = hidden and no promotion prices apply." defaultChecked={promotion?.is_active} />
      </FormSection>
    </ActionForm>
  );
}
