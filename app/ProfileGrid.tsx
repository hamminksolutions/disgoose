"use client";

import { useState } from "react";
import Link from "next/link";
import type { GridEntry } from "@/lib/ratings/getProfileGrid";
import { formatScore } from "@/lib/ratings/formatScore";
import { ListenMethodIcon } from "./ListenMethod";
import { RatingModal } from "./RatingModal";
import { PublicRatingModal } from "./PublicRatingModal";

/** `readOnly` renders the public, non-owner view — no edit/delete affordances in the popup. */
export function ProfileGrid({
  entries,
  readOnly = false,
}: {
  entries: GridEntry[];
  readOnly?: boolean;
}) {
  const [openRatingId, setOpenRatingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-[8px] rounded-xl border border-dashed border-border bg-surface py-[28px] text-center">
        <div className="relative mb-[10px] h-[52px] w-[52px] rounded-full bg-accent">
          <div className="absolute left-[16px] top-[8px] h-[20px] w-[20px] rounded-full bg-canvas" />
        </div>
        <p className="font-heading text-[16px] font-semibold text-text-primary">
          {readOnly ? "This grid is empty — for now" : "Your grid is empty — for now"}
        </p>
        <p className="max-w-xs text-[13px] text-text-muted">
          {readOnly
            ? "No albums rated yet."
            : "Rate your first album and it'll show up here."}
        </p>
        {!readOnly && (
          <Link
            href="/rate"
            className="mt-[10px] rounded-full bg-accent px-[22px] py-[12px] text-[14px] font-bold text-canvas"
          >
            Add your first album
          </Link>
        )}
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
            aria-label={`View rating for ${entry.title} by ${entry.artist}`}
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
            <span className="absolute left-[6px] top-[6px] flex items-center justify-center rounded-full bg-canvas/70 p-[2px]">
              <ListenMethodIcon listenMethod={entry.listenMethod} size={12} />
            </span>
            <span className="absolute bottom-[6px] right-[6px] rounded-full bg-accent px-[7px] py-[2px] text-[12px] font-semibold text-canvas">
              {formatScore(entry.score)}
            </span>
          </button>
        ))}
      </div>

      {openRatingId &&
        (readOnly ? (
          <PublicRatingModal ratingId={openRatingId} onClose={() => setOpenRatingId(null)} />
        ) : (
          <RatingModal ratingId={openRatingId} onClose={() => setOpenRatingId(null)} />
        ))}
    </>
  );
}
