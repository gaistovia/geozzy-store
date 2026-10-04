"use client";

import { useActionState } from "react";
import { Input, Label, FormMessage } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useActionState(login, initialState);
  const message = state.error ?? notice;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {message && <FormMessage id="login-error">{message}</FormMessage>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          aria-describedby={message ? "login-error" : undefined}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton className="w-full" pendingText="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}
