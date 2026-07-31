"use client";

import { useState } from "react";
import type { Friend } from "@/lib/friendships/getFriends";

export function FriendsList({ initialFriends }: { initialFriends: Friend[] }) {
  const [friends, setFriends] = useState(initialFriends);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unfriend(friendshipId: string) {
    setBusyId(friendshipId);
    try {
      const res = await fetch(`/api/friend-requests/${friendshipId}`, { method: "DELETE" });
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (friends.length === 0) return null;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-[8px]">
      <p className="text-[13px] font-semibold text-text-secondary">Friends ({friends.length})</p>
      <div className="flex flex-wrap gap-[8px]">
        {friends.map((f) => (
          <div
            key={f.friendshipId}
            className="flex items-center gap-[8px] rounded-full bg-surface px-[10px] py-[6px]"
          >
            <span className="text-[13px] text-text-primary">{f.username}</span>
            <button
              type="button"
              disabled={busyId === f.friendshipId}
              onClick={() => unfriend(f.friendshipId)}
              className="text-[12px] text-text-muted disabled:opacity-60"
            >
              Unfriend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
