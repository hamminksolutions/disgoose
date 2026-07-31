"use client";

import { useEffect, useState } from "react";
import { RatingCardContent } from "./RatingCardContent";

type RatingDetail = {
  score: number;
  listenMethod: string;
  reviewText: string | null;
  album: { title: string; artist: string; coverUrl: string | null };
};

export function PublicRatingModal({ ratingId, onClose }: { ratingId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<RatingDetail | null>(null);

  useEffect(() => {
    fetch(`/api/ratings/${ratingId}`)
      .then((res) => res.json())
      .then((body) => setDetail(body.rating as RatingDetail));
  }, [ratingId]);

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
          <RatingCardContent
            album={detail.album}
            score={detail.score}
            listenMethod={detail.listenMethod}
            reviewText={detail.reviewText}
          />
        )}
      </div>
    </div>
  );
}
