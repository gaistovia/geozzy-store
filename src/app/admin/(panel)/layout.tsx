import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Every page inside (panel) is protected here as well as in middleware and by
 * database RLS - three independent checks.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-border bg-card md:border-b-0 md:border-r">
        <div className="flex flex-col gap-3 px-4 py-3 md:gap-6 md:py-5">
          <Logo variant="wordmark" height={26} plate />
          <AdminNav role={profile.role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border px-4 py-3 md:px-8">
          <div className="min-w-0 text-right text-sm">
            <p className="truncate font-medium">{profile.full_name || profile.email}</p>
            <Badge tone={profile.role === "admin" ? "gold" : "neutral"}>{profile.role}</Badge>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
