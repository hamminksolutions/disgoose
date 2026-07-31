import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAllRatings, type SortBy } from "@/lib/ratings/getAllRatings";
import { RatingsList } from "./RatingsList";

const PAGE_SIZE = 20;

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortBy: SortBy = params.sortBy === "highest_rated" ? "highest_rated" : "newest";

  const { items, totalCount } = await getAllRatings(
    user.id,
    { page, pageSize: PAGE_SIZE, sortBy },
    { supabase: createAdminSupabaseClient() }
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="flex flex-1 justify-center p-[16px]">
      <div className="w-full max-w-2xl py-[28px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h1 className="font-heading text-[22px] font-bold text-text-primary">All ratings</h1>
          <Link href="/" className="text-[13px] text-accent">
            ← Back to grid
          </Link>
        </div>

        <div className="mb-[14px] flex gap-[8px]">
          <Link
            href={`/ratings?sortBy=newest`}
            className={`rounded-full border px-[12px] py-[6px] text-[13px] ${
              sortBy === "newest" ? "border-accent bg-accent text-canvas" : "border-border text-text-secondary"
            }`}
          >
            Newest first
          </Link>
          <Link
            href={`/ratings?sortBy=highest_rated`}
            className={`rounded-full border px-[12px] py-[6px] text-[13px] ${
              sortBy === "highest_rated"
                ? "border-accent bg-accent text-canvas"
                : "border-border text-text-secondary"
            }`}
          >
            Highest rated
          </Link>
        </div>

        <RatingsList items={items} />

        <div className="mt-[16px] flex items-center justify-center gap-[12px]">
          {page > 1 && (
            <Link
              href={`/ratings?sortBy=${sortBy}&page=${page - 1}`}
              className="text-[13px] text-accent"
            >
              ← Previous
            </Link>
          )}
          <span className="text-[13px] text-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/ratings?sortBy=${sortBy}&page=${page + 1}`}
              className="text-[13px] text-accent"
            >
              Next →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
