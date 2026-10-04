import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Not-found pages cannot read the route's language, so this shows both languages.
 */
export default function NotFound() {
  const sw = getDictionary("sw").notFound;
  const en = getDictionary("en").notFound;
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-4xl font-semibold">{sw.title}</h1>
      <p className="mt-3 text-muted-foreground">{sw.body}</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">{en.title}</h2>
      <p className="mt-2 text-muted-foreground">{en.body}</p>
      <div className="mt-8 flex gap-3">
        <Link href={localePath(defaultLocale, "/")} className={buttonVariants({})}>
          {sw.home}
        </Link>
        <Link href={localePath("en", "/")} className={buttonVariants({ variant: "outline" })}>
          {en.home}
        </Link>
      </div>
    </div>
  );
}
