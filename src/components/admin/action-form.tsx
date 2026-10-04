"use client";

import { useRef, useState, useTransition } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/input";

type Result = { ok?: boolean; error?: string; message?: string } | void;

/**
 * A form that calls a server action WITHOUT clearing what the person typed when something is wrong.
 * Actions return {error} or {ok}; on success they may also redirect.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving...",
  variant = "primary",
  className,
  footer,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
  /** Extra buttons next to the submit button. */
  footer?: React.ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string; message?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={className ?? "space-y-5"}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const res = await action(formData);
          setResult(res ?? null);
          if (res && res.ok && resetOnSuccess) formRef.current?.reset();
        });
      }}
    >
      {children}
      <div aria-live="polite" className="space-y-3">
        {result?.error ? <FormMessage>{result.error}</FormMessage> : null}
        {result?.ok && result.message ? <FormMessage variant="success">{result.message}</FormMessage> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variant} disabled={pending} aria-busy={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
