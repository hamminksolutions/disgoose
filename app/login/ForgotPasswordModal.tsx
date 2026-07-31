"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "./actions";

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, { sent: false });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[16px]"
      onClick={() => !state.sent && onClose()}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        {!state.sent ? (
          <form action={formAction} className="flex flex-col gap-[16px]">
            <h2 className="font-heading text-[18px] font-bold text-text-primary">
              Reset your password
            </h2>
            <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
              Email
              <input
                name="email"
                type="email"
                required
                className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-[12px] text-center">
            <h2 className="font-heading text-[18px] font-bold text-text-primary">
              Check your email
            </h2>
            <p className="text-[13px] text-text-secondary">
              If an account exists for that address, we&apos;ve sent a reset link.
            </p>
            <button type="button" onClick={onClose} className="text-[13px] text-accent">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
