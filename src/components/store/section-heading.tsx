import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">
            {eyebrow}
          </p>
        )}
        <Tag className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</Tag>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}
