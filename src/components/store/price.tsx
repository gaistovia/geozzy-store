import { formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Current price, with the original price struck through only when it is genuinely higher. */
export function Price({
  current,
  regular,
  wasLabel,
  size = "md",
  className,
}: {
  current: number;
  regular: number;
  wasLabel: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const discounted = regular > current;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-base")}>
        {formatTZS(current)}
      </span>
      {discounted && (
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="sr-only">{wasLabel} </span>
          <s>{formatTZS(regular)}</s>
        </span>
      )}
    </p>
  );
}
