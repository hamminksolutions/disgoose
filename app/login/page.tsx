"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const confirmed = useSearchParams().get("confirmed") === "true";

  return (
    <main className="flex flex-1 items-center justify-center p-[16px]">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[28px]"
      >
        <h1 className="font-heading text-[22px] font-bold text-text-primary">Log in to Disgoose</h1>

        {confirmed && (
          <p className="rounded-md bg-accent/10 px-[12px] py-[10px] text-[13px] text-accent" role="status">
            Email confirmed — log in below.
          </p>
        )}

        <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
          />
        </label>

        <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
          />
        </label>

        {state.error && (
          <p className="text-[13px] text-accent" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => setForgotPasswordOpen(true)}
          className="text-[13px] text-accent"
        >
          Forgot password?
        </button>

        <p className="text-[13px] text-text-muted">
          New here?{" "}
          <Link href="/register" className="text-accent">
            Create an account
          </Link>
        </p>
      </form>

      {forgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
