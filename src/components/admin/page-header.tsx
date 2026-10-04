import Link from "next/link";
import { FormMessage } from "@/components/ui/input";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">
          &larr; {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Shows the result of a button action (read from ?saved= / ?error= in the address). */
export function Flash({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const pick = (k: string) => {
    const v = searchParams[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 300);
  };
  const error = pick("error");
  const saved = pick("saved");
  if (!error && !saved) return null;
  return (
    <div className="mb-5">
      {error ? <FormMessage>{error}</FormMessage> : <FormMessage variant="success">{saved}</FormMessage>}
    </div>
  );
}
