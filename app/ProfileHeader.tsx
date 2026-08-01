import { formatScore } from "@/lib/ratings/formatScore";
import type { RatingStats } from "@/lib/ratings/getRatingStats";

/** `@handle · collecting since <year>` plus album count / avg rating — hidden until the user has rated something, matching the prototype's empty-state header. */
export function ProfileHeader({
  username,
  collectingSince,
  stats,
}: {
  username: string;
  collectingSince: number | null;
  stats: RatingStats;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-[18px]">
      <p className="text-[14px] text-text-muted">
        @{username}
        {collectingSince !== null && ` · collecting since ${collectingSince}`}
      </p>

      {stats.count > 0 && (
        <div className="flex gap-[22px]">
          <div className="text-center">
            <p className="font-heading text-[22px] font-bold text-text-primary">{stats.count}</p>
            <p className="text-[12px] text-text-muted">albums</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-[22px] font-bold text-accent">
              {formatScore(stats.avgScore ?? 0)}
            </p>
            <p className="text-[12px] text-text-muted">avg. rating</p>
          </div>
        </div>
      )}
    </div>
  );
}
