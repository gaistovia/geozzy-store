import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";
import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name_en").order("sort_order");
  return (
    <div className="max-w-3xl">
      <PageHeader title="New product" back={{ href: "/admin/products", label: "All products" }} />
      <ProductForm mode="create" categories={categories ?? []} action={createProductAction} />
    </div>
  );
}
