/** The read-only score badge + listen method + review paragraph, shown in RatingModal's non-editing state. */
export function ScoreAndReview({
  score,
  listenMethod,
  reviewText,
}: {
  score: number;
  listenMethod: string;
  reviewText: string | null;
}) {
  return (
    <>
      <div className="flex items-center gap-[10px]">
        <span className="rounded-full bg-accent px-[10px] py-[3px] text-[14px] font-semibold text-canvas">
          {(score / 10).toFixed(1)}
        </span>
        <span className="text-[13px] text-text-secondary">{listenMethod}</span>
      </div>

      {reviewText && (
        <p className="whitespace-pre-wrap text-[14px] text-text-primary">{reviewText}</p>
      )}
    </>
  );
}
