import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-card px-3.5 text-base text-foreground",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

/** Inline form message. Use variant="error" for problems and "success" for confirmations. */
export function FormMessage({
  variant = "error",
  children,
  id,
}: {
  variant?: "error" | "success";
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p
      id={id}
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "error"
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-success/30 bg-success/10 text-success",
      )}
    >
      {children}
    </p>
  );
}
