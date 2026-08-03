"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListenMethod } from "@/lib/ratings/upsertRating";
import { AlbumHeader } from "./AlbumHeader";
import { RatingFields } from "./RatingFields";
import { ScoreAndReview } from "./ScoreAndReview";
import { useEscapeToClose } from "./useEscapeToClose";

type RatingDetail = {
  id: string;
  score: number;
  listenMethod: ListenMethod;
  owned: boolean;
  reviewText: string | null;
  album: { title: string; artist: string; coverUrl: string | null };
};

export function RatingModal({ ratingId, onClose }: { ratingId: string; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<RatingDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(5);
  const [listenMethod, setListenMethod] = useState<ListenMethod>("spotify");
  const [owned, setOwned] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEscapeToClose(onClose);

  useEffect(() => {
    fetch(`/api/ratings/${ratingId}`)
      .then((res) => res.json())
      .then((body) => {
        const d = body.rating as RatingDetail;
        setDetail(d);
        setScore(d.score / 10);
        setListenMethod(d.listenMethod);
        setOwned(d.owned);
        setReviewText(d.reviewText ?? "");
      });
  }, [ratingId]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/ratings/${ratingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: Math.round(score * 10),
        listenMethod,
        owned,
        reviewText: reviewText.length > 0 ? reviewText : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not save changes");
      return;
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Delete this rating? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/ratings/${ratingId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not delete rating");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[16px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[22px]"
      >
        {!detail ? (
          <p className="text-[13px] text-text-muted">Loading…</p>
        ) : (
          <>
            <AlbumHeader album={detail.album} />

            {!editing ? (
              <>
                <ScoreAndReview
                  score={detail.score}
                  listenMethod={detail.listenMethod}
                  owned={detail.owned}
                  reviewText={detail.reviewText}
                />
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex-1 rounded-md border border-border px-[14px] py-[8px] text-[13px] text-text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy}
                    className="flex-1 rounded-md border border-border px-[14px] py-[8px] text-[13px] text-accent"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <RatingFields
                  score={score}
                  onScoreChange={setScore}
                  listenMethod={listenMethod}
                  onListenMethodChange={setListenMethod}
                  owned={owned}
                  onOwnedChange={setOwned}
                  reviewText={reviewText}
                  onReviewTextChange={setReviewText}
                />

                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-md border border-border px-[14px] py-[8px] text-[13px] text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={busy}
                    className="flex-1 rounded-md bg-accent px-[14px] py-[8px] text-[13px] font-semibold text-canvas"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="text-[13px] text-accent" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
