import { formatScore } from "@/lib/ratings/formatScore";
import type { RatingStats } from "@/lib/ratings/getRatingStats";
import { Avatar } from "./Avatar";

/** Avatar + `@handle · collecting since <year>` plus album count / avg rating — stats hidden until the user has rated something, matching the prototype's empty-state header. */
export function ProfileHeader({
  username,
  avatarUrl,
  collectingSince,
  stats,
}: {
  username: string;
  avatarUrl: string | null;
  collectingSince: number | null;
  stats: RatingStats;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-wrap items-center gap-[18px]">
      <Avatar avatarUrl={avatarUrl} username={username} size={64} />

      <div className="flex flex-1 flex-wrap items-center justify-between gap-[18px]">
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
    </div>
  );
}
