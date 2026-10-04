import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Checkbox, Field, FormSection, Textarea, TwoCol } from "@/components/admin/fields";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createFaqAction, deleteFaqAction, updateFaqAction } from "./actions";

export const metadata: Metadata = { title: "FAQs" };

type Faq = { id: string; question_sw: string; question_en: string; answer_sw: string; answer_en: string; sort_order: number; is_published: boolean };

function FaqFields({ faq }: { faq?: Faq }) {
  const k = faq?.id ?? "new";
  return (
    <>
      <TwoCol>
        <Field label="Question (Kiswahili)" htmlFor={`qsw-${k}`}><Input id={`qsw-${k}`} name="question_sw" maxLength={300} defaultValue={faq?.question_sw ?? ""} /></Field>
        <Field label="Question (English)" htmlFor={`qen-${k}`}><Input id={`qen-${k}`} name="question_en" maxLength={300} defaultValue={faq?.question_en ?? ""} /></Field>
        <Field label="Answer (Kiswahili)" htmlFor={`asw-${k}`}><Textarea id={`asw-${k}`} name="answer_sw" rows={3} maxLength={2000} defaultValue={faq?.answer_sw ?? ""} /></Field>
        <Field label="Answer (English)" htmlFor={`aen-${k}`}><Textarea id={`aen-${k}`} name="answer_en" rows={3} maxLength={2000} defaultValue={faq?.answer_en ?? ""} /></Field>
      </TwoCol>
      <div className="flex flex-wrap items-end gap-6">
        <Field label="Order" htmlFor={`so-${k}`} hint="Smaller first"><Input id={`so-${k}`} name="sort_order" inputMode="numeric" defaultValue={faq?.sort_order ?? 100} className="w-24" /></Field>
        <Checkbox name="is_published" label="Show on the website" defaultChecked={faq ? faq.is_published : true} />
      </div>
    </>
  );
}

export default async function FaqsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
  const faqs = (data ?? []) as Faq[];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="FAQs" description="Questions shown on the FAQ page. Use {{return_days}} in an answer to insert the return period from Store settings." />
      <Flash searchParams={sp} />
      {error && <p className="text-danger">Could not load FAQs: {error.message}</p>}

      <ul className="space-y-3">
        {faqs.map((f) => (
          <li key={f.id}>
            <details className="group rounded-2xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{f.question_en || f.question_sw}</span>
                <Badge tone={f.is_published ? "success" : "neutral"}>{f.is_published ? "shown" : "hidden"}</Badge>
              </summary>
              <div className="space-y-4 border-t border-border p-5">
                <ActionForm action={updateFaqAction.bind(null, f.id)} submitLabel="Save question">
                  <FaqFields faq={f} />
                </ActionForm>
                <form action={deleteFaqAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <ConfirmButton size="sm" variant="ghost" className="text-danger" message="Delete this question?">Delete question</ConfirmButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <FormSection title="Add a question">
        <ActionForm action={createFaqAction} submitLabel="Add question" resetOnSuccess>
          <FaqFields />
        </ActionForm>
      </FormSection>
    </div>
  );
}
