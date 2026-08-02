function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

/** Circle avatar image, matching the prototype's `<image-slot id="avatar" shape="circle">`; falls back to initials when there's no `avatarUrl` yet. */
export function Avatar({
  avatarUrl,
  username,
  size = 44,
}: {
  avatarUrl: string | null;
  username: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-text-secondary"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className={`font-heading font-bold ${size >= 64 ? "text-[22px]" : "text-[14px]"}`}
        >
          {initials(username)}
        </span>
      )}
    </div>
  );
}
