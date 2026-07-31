"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RatingDetail = {
  id: string;
  score: number;
  listenMethod: string;
  reviewText: string | null;
  album: { title: string; artist: string; coverUrl: string | null };
};

const LISTEN_METHODS: { value: string; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "cd", label: "CD" },
  { value: "vinyl", label: "Vinyl" },
  { value: "streaming_other", label: "Other streaming" },
  { value: "other", label: "Other" },
];

const REVIEW_MAX_LENGTH = 2000;

function clampScore(value: number) {
  return Math.min(10, Math.max(1, Math.round(value * 10) / 10));
}

export function RatingModal({ ratingId, onClose }: { ratingId: string; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<RatingDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(5);
  const [listenMethod, setListenMethod] = useState("spotify");
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ratings/${ratingId}`)
      .then((res) => res.json())
      .then((body) => {
        const d = body.rating as RatingDetail;
        setDetail(d);
        setScore(d.score / 10);
        setListenMethod(d.listenMethod);
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
            <div className="flex gap-[12px]">
              <div className="aspect-square w-[64px] shrink-0 overflow-hidden rounded-md bg-surface-raised">
                {detail.album.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.album.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-heading text-[15px] font-semibold text-text-primary">
                  {detail.album.title}
                </p>
                <p className="text-[13px] text-text-secondary">{detail.album.artist}</p>
              </div>
            </div>

            {!editing ? (
              <>
                <div className="flex items-center gap-[10px]">
                  <span className="rounded-full bg-accent px-[10px] py-[3px] text-[14px] font-semibold text-canvas">
                    {(detail.score / 10).toFixed(1)}
                  </span>
                  <span className="text-[13px] text-text-secondary">{detail.listenMethod}</span>
                </div>
                {detail.reviewText && (
                  <p className="whitespace-pre-wrap text-[14px] text-text-primary">
                    {detail.reviewText}
                  </p>
                )}
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
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] text-text-secondary">Score</span>
                  <div className="flex items-center gap-[10px]">
                    <button
                      type="button"
                      aria-label="Decrease score"
                      onClick={() => setScore((s) => clampScore(s - 0.1))}
                      className="h-[36px] w-[36px] rounded-md border border-border text-[16px] text-text-primary"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.1}
                      min={1}
                      max={10}
                      value={score.toFixed(1)}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        if (!Number.isNaN(parsed)) setScore(clampScore(parsed));
                      }}
                      className="w-[72px] rounded-md border border-border bg-canvas px-[10px] py-[8px] text-center text-[18px] font-bold text-text-primary"
                    />
                    <button
                      type="button"
                      aria-label="Increase score"
                      onClick={() => setScore((s) => clampScore(s + 0.1))}
                      className="h-[36px] w-[36px] rounded-md border border-border text-[16px] text-text-primary"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] text-text-secondary">Listen method</span>
                  <div className="flex flex-wrap gap-[8px]">
                    {LISTEN_METHODS.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setListenMethod(method.value)}
                        className={`rounded-full border px-[14px] py-[7px] text-[13px] ${
                          listenMethod === method.value
                            ? "border-accent bg-accent text-canvas"
                            : "border-border text-text-secondary"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
                  Review
                  <textarea
                    value={reviewText}
                    maxLength={REVIEW_MAX_LENGTH}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="resize-none rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
                  />
                  <span className="self-end text-[12px] text-text-muted">
                    {reviewText.length}/{REVIEW_MAX_LENGTH}
                  </span>
                </label>

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
