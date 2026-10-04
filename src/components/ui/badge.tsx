import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "gold" | "success" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  gold: "bg-gold-100 text-gold-900",
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
