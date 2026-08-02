import type { ListenMethod } from "@/lib/ratings/upsertRating";
import { ListenMethodBadge } from "./ListenMethod";
import { OwnedBadge } from "./Owned";

/** The read-only score badge + listen method + review paragraph, shown in RatingModal's non-editing state. */
export function ScoreAndReview({
  score,
  listenMethod,
  owned,
  reviewText,
}: {
  score: number;
  listenMethod: ListenMethod;
  owned: boolean;
  reviewText: string | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-[10px]">
        <span className="rounded-full bg-accent px-[10px] py-[3px] text-[14px] font-semibold text-canvas">
          {(score / 10).toFixed(1)}
        </span>
        <ListenMethodBadge listenMethod={listenMethod} />
        {owned && <OwnedBadge />}
      </div>

      {reviewText && (
        <p className="whitespace-pre-wrap text-[14px] text-text-primary">{reviewText}</p>
      )}
    </>
  );
}
