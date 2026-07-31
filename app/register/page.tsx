"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {
    error: null,
    registered: false,
  });

  if (state.registered) {
    return (
      <main className="flex flex-1 items-center justify-center p-[16px]">
        <div className="flex w-full max-w-sm flex-col gap-[12px] rounded-xl bg-surface p-[28px] text-center">
          <h1 className="font-heading text-[20px] font-bold text-text-primary">Check your email</h1>
          <p className="text-[13px] text-text-secondary">
            We&apos;ve sent a confirmation link — click it to activate your account, then log in.
          </p>
          <Link href="/login" className="text-[13px] text-accent">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-[16px]">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[28px]"
      >
        <h1 className="font-heading text-[22px] font-bold text-text-primary">
          Create your Disgoose account
        </h1>

        <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
          Username
          <input
            name="username"
            required
            minLength={3}
            className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
          />
        </label>

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
            minLength={8}
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
          {pending ? "Creating account…" : "Create account"}
        </button>

        <p className="text-[13px] text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
