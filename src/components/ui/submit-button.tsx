"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingText?: string;
}

/** A submit button that disables itself and shows progress while a form action runs. */
export function SubmitButton({ children, pendingText = "Please wait...", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
