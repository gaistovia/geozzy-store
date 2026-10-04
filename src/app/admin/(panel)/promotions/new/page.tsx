import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { createPromotionAction } from "../actions";
import { PromotionForm } from "../promotion-form";

export const metadata: Metadata = { title: "New promotion" };

export default function NewPromotionPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New promotion" back={{ href: "/admin/promotions", label: "All promotions" }} />
      <PromotionForm mode="create" action={createPromotionAction} />
    </div>
  );
}
