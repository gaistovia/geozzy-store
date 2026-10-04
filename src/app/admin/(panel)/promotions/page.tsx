import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Promotions" };

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: promos, error } = await supabase.from("promotions").select("id, name, is_active, starts_at, ends_at").order("created_at", { ascending: false });
  const now = Date.now();

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="A promotion groups products and can give them a special price while it is running. It appears on the Offers page."
        actions={<Link href="/admin/promotions/new" className={buttonVariants({})}>Add promotion</Link>}
      />
      <Flash searchParams={sp} />
      {error ? (
        <p className="text-danger">Could not load promotions: {error.message}</p>
      ) : !promos || promos.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No promotions yet.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {promos.map((p) => {
            const started = !p.starts_at || new Date(p.starts_at).getTime() <= now;
            const ended = p.ends_at && new Date(p.ends_at).getTime() <= now;
            const live = p.is_active && started && !ended;
            return (
              <Link key={p.id} href={`/admin/promotions/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/60">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.starts_at ? formatDateTime(p.starts_at) : "No start"} &rarr; {p.ends_at ? formatDateTime(p.ends_at) : "No end"}
                  </p>
                </div>
                <Badge tone={live ? "success" : "neutral"}>{live ? "live now" : ended ? "ended" : !p.is_active ? "off" : "scheduled"}</Badge>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
