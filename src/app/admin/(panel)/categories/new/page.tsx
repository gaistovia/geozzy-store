import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { createCategoryAction } from "../actions";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "All categories" }} />
      <CategoryForm mode="create" action={createCategoryAction} />
    </div>
  );
}
