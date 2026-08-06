/**
 * Green pill badge marking a rating as owned — detail modal and the all-ratings list, alongside `ListenMethodBadge`.
 * Always renders (invisibly when not owned) so it reserves its width, keeping `ListenMethodBadge` at a fixed
 * position immediately to its right regardless of whether this row/record is owned.
 */
export function OwnedBadge({ owned }: { owned: boolean }) {
  return (
    <span
      aria-hidden={!owned}
      className={`inline-flex shrink-0 items-center gap-[6px] rounded-full border-[1.5px] border-accent-secondary bg-accent-secondary/16 px-[12px] py-[6px] text-[12.5px] font-bold text-accent-secondary ${
        owned ? "" : "invisible"
      }`}
    >
      Owned
    </span>
  );
}

/** Green ring overlay marking an owned grid cell — sits absolutely inside the cell's existing container. */
export function OwnedRing() {
  return (
    <span className="pointer-events-none absolute inset-0 rounded-md border-[2.5px] border-accent-secondary" />
  );
}

/** "I own this physical copy" checkbox row for the rate/edit flow — caller renders it only when the selected listen method is physical (vinyl/cd). */
export function OwnedCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-[10px] rounded-xl bg-surface-raised px-[14px] py-[12px] text-left"
    >
      <span
        className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-sm border-2 border-accent ${
          checked ? "bg-accent" : "bg-transparent"
        }`}
      >
        {checked && <span className="h-[9px] w-[9px] bg-canvas" />}
      </span>
      <span className="text-[13.5px] font-semibold text-text-secondary">
        I own this physical copy
      </span>
    </button>
  );
}
