"use client";

import { useState } from "react";
import type { PendingRequest } from "@/lib/friendships/getPendingRequests";

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function FriendRequestsBell({ initialRequests }: { initialRequests: PendingRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      const res = await fetch(
        action === "accept" ? `/api/friend-requests/${id}/accept` : `/api/friend-requests/${id}`,
        { method: action === "accept" ? "POST" : "DELETE" }
      );
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed right-[16px] top-[16px] z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Friend requests"
        className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-surface-raised text-[18px]"
      >
        🔔
        {requests.length > 0 && (
          <span className="absolute -right-[2px] -top-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-canvas">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[48px] flex w-[300px] max-w-[calc(100vw-32px)] flex-col gap-[10px] overflow-hidden rounded-xl bg-surface-raised p-[14px] shadow-lg">
          <p className="text-[13px] font-semibold text-text-secondary">Friend requests</p>
          {requests.length === 0 ? (
            <p className="text-[13px] text-text-muted">No pending requests.</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex min-w-0 items-center gap-[8px]">
                <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-surface text-[13px] font-semibold text-text-secondary">
                  {initials(r.requesterUsername)}
                </div>
                <span className="min-w-0 flex-1 truncate text-[14px] text-text-primary">
                  {r.requesterUsername}
                </span>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => respond(r.id, "decline")}
                  className="shrink-0 rounded-md border border-border px-[8px] py-[5px] text-[12px] text-text-secondary disabled:opacity-60"
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => respond(r.id, "accept")}
                  className="shrink-0 rounded-md bg-accent px-[8px] py-[5px] text-[12px] font-semibold text-canvas disabled:opacity-60"
                >
                  Accept
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
