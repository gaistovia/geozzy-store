"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/** A submit button that asks "Are you sure?" first. */
export function ConfirmButton({ message, ...props }: ButtonProps & { message: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    />
  );
}
