"use client";

import { useActionState } from "react";
import { sendFriendRequestAction } from "./friendRequestActions";

export function AddFriendForm() {
  const [state, formAction, pending] = useActionState(sendFriendRequestAction, {
    error: null,
    sent: false,
  });

  return (
    <form action={formAction} className="flex items-center gap-[8px]">
      <input
        name="username"
        placeholder="Add a friend by username"
        required
        className="rounded-md border border-border bg-canvas px-[10px] py-[7px] text-[13px] text-text-primary outline-none focus:border-border-strong"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-[12px] py-[7px] text-[13px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send request"}
      </button>
      {state.sent && <span className="text-[12.5px] text-accent-secondary">Sent!</span>}
      {state.error && (
        <span className="text-[12.5px] text-accent" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
