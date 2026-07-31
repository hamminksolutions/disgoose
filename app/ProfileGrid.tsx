"use client";

import { useState } from "react";
import type { GridEntry } from "@/lib/ratings/getProfileGrid";
import { RatingModal } from "./RatingModal";

function formatScore(score: number) {
  return (score / 10).toFixed(1);
}

export function ProfileGrid({ entries }: { entries: GridEntry[] }) {
  const [openRatingId, setOpenRatingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-[8px] rounded-xl border border-dashed border-border bg-surface py-[28px] text-center">
        <p className="font-heading text-[16px] font-semibold text-text-primary">
          Your grid is empty — for now
        </p>
        <p className="max-w-xs text-[13px] text-text-muted">
          Rate your first album and it&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid w-full max-w-2xl grid-cols-4 gap-[8px] sm:grid-cols-5 md:grid-cols-8">
        {entries.map((entry) => (
          <button
            key={entry.ratingId}
            type="button"
            onClick={() => setOpenRatingId(entry.ratingId)}
            className="group relative aspect-square overflow-hidden rounded-md bg-surface-raised text-left"
          >
            {entry.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.coverUrl}
                alt={`${entry.title} by ${entry.artist}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-[6px] text-center text-[10px] text-text-muted">
                {entry.title}
              </div>
            )}
            <span className="absolute bottom-[6px] right-[6px] rounded-full bg-accent px-[7px] py-[2px] text-[12px] font-semibold text-canvas">
              {formatScore(entry.score)}
            </span>
          </button>
        ))}
      </div>

      {openRatingId && (
        <RatingModal ratingId={openRatingId} onClose={() => setOpenRatingId(null)} />
      )}
    </>
  );
}
