import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { Field, FormSection, Textarea, TwoCol } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { parseSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Store settings" };

function Pair({ name, label, defaults, rows = 2, max }: { name: string; label: string; defaults: { sw: string; en: string }; rows?: number; max: number }) {
  return (
    <TwoCol>
      <Field label={`${label} (Kiswahili)`} htmlFor={`${name}_sw`}><Textarea id={`${name}_sw`} name={`${name}_sw`} rows={rows} maxLength={max} defaultValue={defaults.sw} /></Field>
      <Field label={`${label} (English)`} htmlFor={`${name}_en`}><Textarea id={`${name}_en`} name={`${name}_en`} rows={rows} maxLength={max} defaultValue={defaults.en} /></Field>
    </TwoCol>
  );
}

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("key, value");
  const s = parseSettings(data ?? []);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Store settings" description="Details shown across the website. Empty fields are simply hidden." />
      <ActionForm action={saveSettingsAction} submitLabel="Save settings" className="space-y-6">
        <FormSection title="Store">
          <Field label="Store name" htmlFor="store_name"><Input id="store_name" name="store_name" required maxLength={80} defaultValue={s.storeName} /></Field>
          <Pair name="tagline" label="Tagline" defaults={s.tagline} rows={1} max={120} />
        </FormSection>

        <FormSection title="WhatsApp and contact" hint="Changing the WhatsApp number updates every WhatsApp button on the website. Orders go to this number.">
          <Field label="WhatsApp number" htmlFor="whatsapp_number" hint="With country code, e.g. +255 786 282 109">
            <Input id="whatsapp_number" name="whatsapp_number" required inputMode="tel" defaultValue={s.whatsappNumber} />
          </Field>
          <TwoCol>
            <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" maxLength={254} defaultValue={s.email} /></Field>
            <Field label="Address" htmlFor="address"><Input id="address" name="address" maxLength={300} defaultValue={s.address} /></Field>
          </TwoCol>
          <Pair name="business_hours" label="Opening hours" defaults={s.businessHours} rows={3} max={400} />
        </FormSection>

        <FormSection title="Social media" hint="Full links starting with https://. Empty ones are hidden.">
          <TwoCol>
            <Field label="Instagram" htmlFor="social_instagram"><Input id="social_instagram" name="social_instagram" type="url" maxLength={300} defaultValue={s.instagram} /></Field>
            <Field label="Facebook" htmlFor="social_facebook"><Input id="social_facebook" name="social_facebook" type="url" maxLength={300} defaultValue={s.facebook} /></Field>
            <Field label="TikTok" htmlFor="social_tiktok"><Input id="social_tiktok" name="social_tiktok" type="url" maxLength={300} defaultValue={s.tiktok} /></Field>
            <Field label="YouTube" htmlFor="social_youtube"><Input id="social_youtube" name="social_youtube" type="url" maxLength={300} defaultValue={s.youtube} /></Field>
          </TwoCol>
        </FormSection>

        <FormSection title="Messages on the website">
          <Pair name="announcement" label="Announcement bar" defaults={s.announcement} rows={1} max={200} />
          <p className="-mt-2 text-xs text-muted-foreground">Shown in a gold bar at the very top of every page. Leave both empty for no bar. Only announce things that are true.</p>
          <Pair name="delivery_info" label="Delivery information" defaults={s.deliveryInfo} rows={3} max={600} />
          <Pair name="footer_text" label="Footer text" defaults={s.footerText} rows={2} max={300} />
        </FormSection>

        <FormSection title="Policies and stock">
          <TwoCol>
            <Field label="Return period (days)" htmlFor="return_policy_days" hint="Used wherever the website mentions returns.">
              <Input id="return_policy_days" name="return_policy_days" inputMode="numeric" defaultValue={s.returnPolicyDays} />
            </Field>
            <Field label="Low-stock warning at (pairs)" htmlFor="low_stock_threshold" hint="Customers see 'Only N left' at or below this number.">
              <Input id="low_stock_threshold" name="low_stock_threshold" inputMode="numeric" defaultValue={s.lowStockThreshold} />
            </Field>
          </TwoCol>
          <p className="text-sm text-muted-foreground">Currency: TZS (fixed).</p>
        </FormSection>
      </ActionForm>
    </div>
  );
}
