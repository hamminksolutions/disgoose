import Link from "next/link";

const TABS = [
  { key: "profile", label: "Profile", href: "/" },
  { key: "ratings", label: "All Ratings", href: "/ratings" },
  { key: "social", label: "Social", href: "/social" },
  { key: "settings", label: "Settings", href: "/settings" },
] as const;

export function TopNav({ active }: { active?: (typeof TABS)[number]["key"] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-[16px] border-b border-border px-[28px] py-[16px]">
      <div className="flex flex-wrap items-center gap-[28px]">
        <Link href="/" className="flex items-center gap-[9px]">
          <span className="relative block h-[30px] w-[30px] flex-none rounded-full bg-accent">
            <span className="absolute left-[9px] top-[4px] h-[12px] w-[12px] rounded-full bg-canvas" />
          </span>
          <span className="font-heading text-[20px] font-extrabold tracking-[-0.02em] text-text-primary">
            Disgoose
          </span>
        </Link>

        <div className="flex flex-wrap gap-[6px]">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`rounded-full px-[16px] py-[9px] text-[14px] font-semibold ${
                active === tab.key ? "bg-accent text-canvas" : "text-text-secondary"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/rate"
        className="flex min-h-[44px] items-center gap-[8px] rounded-full bg-accent px-[18px] py-[11px] text-[14px] font-bold text-canvas"
      >
        <span className="text-[18px] font-extrabold leading-none">+</span> Add album
      </Link>
    </div>
  );
}
