import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentStaff } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
        <Card>
          <CardBody>
            <h1 className="font-display text-2xl font-semibold">Admin is not configured</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment
              variables, then redeploy. See the README for the exact steps.
            </p>
          </CardBody>
        </Card>
      </main>
    );
  }

  if (await getCurrentStaff()) redirect("/admin");

  const { error } = await searchParams;
  const notice =
    error === "forbidden" ? "This account does not have access to the admin area." : undefined;

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 flex justify-center">
        <Logo variant="wordmark" height={44} plate priority />
      </div>
      <Card>
        <CardBody className="p-6">
          <h1 className="font-display text-3xl font-semibold">Sign in</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Store owners and staff only.
          </p>
          <LoginForm notice={notice} />
        </CardBody>
      </Card>
    </main>
  );
}
