import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, FormSection, Textarea, TwoCol } from "@/components/admin/fields";
import { SingleImageField } from "@/components/admin/image-uploads";
import { PageHeader } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { asArray, asObject } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { saveHomepageAction } from "./actions";

export const metadata: Metadata = { title: "Homepage" };

const pair = (v: unknown) => {
  const o = asObject(v);
  return { sw: typeof o.sw === "string" ? o.sw : "", en: typeof o.en === "string" ? o.en : "" };
};

function Pair({ name, label, defaults, textarea, max }: { name: string; label: string; defaults: { sw: string; en: string }; textarea?: boolean; max: number }) {
  return (
    <TwoCol>
      <Field label={`${label} (Kiswahili)`} htmlFor={`${name}_sw`}>
        {textarea ? <Textarea id={`${name}_sw`} name={`${name}_sw`} rows={2} maxLength={max} defaultValue={defaults.sw} /> : <Input id={`${name}_sw`} name={`${name}_sw`} maxLength={max} defaultValue={defaults.sw} />}
      </Field>
      <Field label={`${label} (English)`} htmlFor={`${name}_en`}>
        {textarea ? <Textarea id={`${name}_en`} name={`${name}_en`} rows={2} maxLength={max} defaultValue={defaults.en} /> : <Input id={`${name}_en`} name={`${name}_en`} maxLength={max} defaultValue={defaults.en} />}
      </Field>
    </TwoCol>
  );
}

export default async function HomepageAdminPage() {
  const supabase = await createClient();
  const { data: sections } = await supabase.from("homepage_sections").select("section_key, content, image_path, is_active");
  const get = (key: string) => sections?.find((s) => s.section_key === key);
  const hero = asObject(get("hero")?.content);
  const why = asObject(get("why_shop")?.content);
  const cta = asObject(get("whatsapp_cta")?.content);
  const whyItems = asArray(why.items).map((i) => asObject(i));

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Homepage"
        description="Change the words and picture at the top of your homepage and the other homepage blocks. Which products and categories appear is set on each product and category (Featured / New arrival / Show on the homepage)."
        actions={<Link href="/" target="_blank" className="text-sm underline underline-offset-4">View homepage</Link>}
      />
      <ActionForm action={saveHomepageAction} submitLabel="Save homepage" className="space-y-6">
        <FormSection title="Top banner (hero)">
          <Pair name="hero_headline" label="Headline" defaults={pair(hero.headline)} max={120} />
          <Pair name="hero_description" label="Description" defaults={pair(hero.description)} max={300} textarea />
          <Pair name="hero_primary_cta" label="Main button" defaults={pair(hero.primary_cta)} max={40} />
          <Pair name="hero_secondary_cta" label="Second button" defaults={pair(hero.secondary_cta)} max={40} />
          <SingleImageField name="hero_image_path" folder="homepage" initialPath={get("hero")?.image_path ?? null} label="Banner image (optional)" hint="If empty, the banner shows your newest product photos, or the logo." />
        </FormSection>

        <FormSection title="How shopping works" hint="Up to three short points. Use {{return_days}} to insert the return period from Store settings.">
          <Checkbox name="why_active" label="Show this block" defaultChecked={get("why_shop") ? get("why_shop")!.is_active : true} />
          {[1, 2, 3].map((n) => {
            const item = whyItems[n - 1] ?? {};
            return (
              <div key={n} className="space-y-3 rounded-xl border border-border p-3">
                <p className="text-sm font-medium">Point {n}</p>
                <Pair name={`why${n}_title`} label="Title" defaults={pair(item.title)} max={80} />
                <Pair name={`why${n}_text`} label="Text" defaults={pair(item.text)} max={240} textarea />
              </div>
            );
          })}
        </FormSection>

        <FormSection title="WhatsApp block (bottom of the page)">
          <Checkbox name="cta_active" label="Show this block" defaultChecked={get("whatsapp_cta") ? get("whatsapp_cta")!.is_active : true} />
          <Pair name="cta_headline" label="Headline" defaults={pair(cta.headline)} max={120} />
          <Pair name="cta_text" label="Text" defaults={pair(cta.text)} max={300} textarea />
        </FormSection>
      </ActionForm>
    </div>
  );
}
