import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: categories, error }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("id, slug, name_en, name_sw, is_visible, is_featured, sort_order").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);
  const perCategory = new Map<string, number>();
  for (const row of counts ?? []) if (row.category_id) perCategory.set(row.category_id, (perCategory.get(row.category_id) ?? 0) + 1);

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Categories appear in the shop menu and on the homepage."
        actions={<Link href="/admin/categories/new" className={buttonVariants({})}>Add category</Link>}
      />
      <Flash searchParams={sp} />
      {error ? (
        <p className="text-danger">Could not load categories: {error.message}</p>
      ) : (
        <Card className="divide-y divide-border">
          {(categories ?? []).map((c) => (
            <Link key={c.id} href={`/admin/categories/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60">
              <div>
                <p className="font-medium">{c.name_en}</p>
                <p className="text-xs text-muted-foreground">{c.name_sw} &middot; /category/{c.slug}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{perCategory.get(c.id) ?? 0} products</span>
                {c.is_featured && <Badge tone="gold">homepage</Badge>}
                <Badge tone={c.is_visible ? "success" : "neutral"}>{c.is_visible ? "visible" : "hidden"}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
