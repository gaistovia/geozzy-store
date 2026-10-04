import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Select } from "@/components/admin/fields";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteCategoryAction, updateCategoryAction } from "../actions";
import { CategoryForm, type CategoryRow } from "../category-form";

export const metadata: Metadata = { title: "Edit category" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCategoryPage({
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
  const [{ data: category }, { count }, { data: others }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("categories").select("id, name_en").neq("id", id).order("sort_order"),
  ]);
  if (!category) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title={category.name_en} back={{ href: "/admin/categories", label: "All categories" }} description={`${count ?? 0} product(s) in this category.`} />
      <Flash searchParams={sp} />
      <CategoryForm mode="edit" category={category as CategoryRow} action={updateCategoryAction.bind(null, id)} />

      <Card className="space-y-4 p-5">
        <h2 className="font-display text-xl font-semibold">Delete category</h2>
        {profile.role !== "admin" ? (
          <p className="text-sm text-muted-foreground">Only an administrator can delete categories. You can hide it instead (untick &ldquo;Visible on the website&rdquo;).</p>
        ) : (
          <form action={deleteCategoryAction} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            {(count ?? 0) > 0 ? (
              <div>
                <label htmlFor="move_to" className="mb-1.5 block text-sm font-medium">
                  This category has {count} product(s). Move them to:
                </label>
                <Select id="move_to" name="move_to" defaultValue="">
                  <option value="">Choose a category...</option>
                  {(others ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This category is empty and can be deleted safely.</p>
            )}
            <ConfirmButton variant="danger" message={`Delete the category "${category.name_en}"?`}>Delete category</ConfirmButton>
          </form>
        )}
      </Card>
    </div>
  );
}
