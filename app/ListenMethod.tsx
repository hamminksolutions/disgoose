import type { ListenMethod } from "@/lib/ratings/upsertRating";

export const LISTEN_METHODS: { value: ListenMethod; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "cd", label: "CD" },
  { value: "vinyl", label: "Vinyl" },
  { value: "streaming_other", label: "Other streaming" },
  { value: "other", label: "Other" },
];

const LABELS = Object.fromEntries(LISTEN_METHODS.map((m) => [m.value, m.label])) as Record<
  ListenMethod,
  string
>;

export function listenMethodLabel(listenMethod: ListenMethod): string {
  return LABELS[listenMethod];
}

/** The small colored dot/icon standing in for a listen method — prototype's grid-cell indicator and badge glyph. */
export function ListenMethodIcon({
  listenMethod,
  size = 14,
}: {
  listenMethod: ListenMethod;
  size?: number;
}) {
  switch (listenMethod) {
    case "spotify":
      return (
        <span
          className="block shrink-0 rounded-full bg-accent-secondary"
          style={{ width: size, height: size }}
        />
      );
    case "cd":
      return (
        <span
          className="block shrink-0 rounded-full bg-text-secondary"
          style={{ width: size, height: size }}
        />
      );
    case "vinyl":
      return (
        <span
          className="block shrink-0 rounded-full border-2 border-border-strong"
          style={{ width: size, height: size }}
        />
      );
    case "streaming_other":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="currentColor"
          className="shrink-0 text-accent"
        >
          <path d="M3.5 2.5v11l10-5.5-10-5.5z" />
        </svg>
      );
    case "other":
      return (
        <span
          className="block shrink-0 rotate-45 border-2 border-border-strong"
          style={{ width: size * 0.7, height: size * 0.7 }}
        />
      );
  }
}

/**
 * Icon + label pill — all-ratings list rows and the rating detail read view.
 * Fixed width (fits the longest label, "Other streaming") so this badge sits at the same
 * position regardless of which listen method a row has, rather than shifting with label length.
 */
export function ListenMethodBadge({ listenMethod }: { listenMethod: ListenMethod }) {
  return (
    <span className="flex w-[144px] shrink-0 items-center justify-center gap-[6px] rounded-full border border-border px-[10px] py-[6px] text-[13px] font-semibold text-text-secondary">
      <ListenMethodIcon listenMethod={listenMethod} size={12} />
      {listenMethodLabel(listenMethod)}
    </span>
  );
}
