"use client";

import { useState } from "react";
import type { GridEntry } from "@/lib/ratings/getProfileGrid";
import { RatingModal } from "../RatingModal";

function formatScore(score: number) {
  return (score / 10).toFixed(1);
}

export function RatingsList({ items }: { items: GridEntry[] }) {
  const [openRatingId, setOpenRatingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-[13px] text-text-muted">No ratings yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-[6px]">
        {items.map((entry) => (
          <li key={entry.ratingId}>
            <button
              type="button"
              onClick={() => setOpenRatingId(entry.ratingId)}
              className="flex w-full items-center gap-[12px] rounded-lg bg-surface p-[8px] text-left hover:bg-surface-raised"
            >
              <div className="aspect-square w-[40px] shrink-0 overflow-hidden rounded-md bg-surface-raised">
                {entry.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.coverUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-text-primary">{entry.title}</p>
                <p className="truncate text-[12.5px] text-text-secondary">{entry.artist}</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent px-[8px] py-[3px] text-[12.5px] font-semibold text-canvas">
                {formatScore(entry.score)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openRatingId && (
        <RatingModal ratingId={openRatingId} onClose={() => setOpenRatingId(null)} />
      )}
    </>
  );
}
