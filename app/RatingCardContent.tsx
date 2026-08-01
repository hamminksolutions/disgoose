import type { ListenMethod } from "@/lib/ratings/upsertRating";
import { AlbumHeader } from "./AlbumHeader";
import { ScoreAndReview } from "./ScoreAndReview";

type RatingCardContentProps = {
  album: { title: string; artist: string; coverUrl: string | null };
  score: number;
  listenMethod: ListenMethod;
  reviewText: string | null;
};

/** Album header + read-only score/review, for a card with no separate editing state (PublicRatingModal). */
export function RatingCardContent({ album, score, listenMethod, reviewText }: RatingCardContentProps) {
  return (
    <>
      <AlbumHeader album={album} />
      <ScoreAndReview score={score} listenMethod={listenMethod} reviewText={reviewText} />
    </>
  );
}
