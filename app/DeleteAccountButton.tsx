"use client";

import { useState } from "react";
import { deleteAccountAction } from "./account/actions";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13px] text-text-muted"
      >
        Delete account
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[16px]"
      onClick={() => setConfirming(false)}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-[18px] font-bold text-text-primary">Delete account</h2>
        <p className="text-[13px] text-text-secondary">
          This permanently deletes your account, ratings, and friendships. This can&apos;t be
          undone.
        </p>
        <form action={deleteAccountAction} className="flex justify-end gap-[14px]">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[13px] text-text-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-border-strong px-[16px] py-[10px] text-[14px] font-semibold text-text-primary"
          >
            Yes, delete my account
          </button>
        </form>
      </div>
    </div>
  );
}
