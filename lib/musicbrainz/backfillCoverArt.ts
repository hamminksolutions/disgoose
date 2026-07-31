import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoverArtMirror } from "./coverArtMirror";

export type BackfillSummary = {
  migrated: number;
  skipped: number;
};

// Only rows still pointing at Cover Art Archive directly are selected —
// already-mirrored rows (Supabase Storage URLs) and albums with no cover
// (null) never match, which is what makes a re-run safe on its own.
const DIRECT_LINK_PREFIX = "https://coverartarchive.org/";

// PostgREST caps a single response at 1000 rows by default — paged so a
// larger PoC-era backlog doesn't silently get only partially backfilled.
const PAGE_SIZE = 1000;

async function fetchPageToBackfill(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("albums")
    .select("mb_release_group_id, cover_url")
    .like("cover_url", `${DIRECT_LINK_PREFIX}%`)
    .range(0, PAGE_SIZE - 1);
  if (error) {
    throw new Error(`Could not list albums to backfill: ${error.message}`);
  }
  return data ?? [];
}

export async function backfillCoverArt({
  supabase,
  coverMirror,
}: {
  supabase: SupabaseClient;
  coverMirror: CoverArtMirror;
}): Promise<BackfillSummary> {
  let migrated = 0;
  // A row that fails (mirror or write) stays in the filtered set and gets
  // re-fetched by every later pagination pass — keyed by id, not counted,
  // so a permanently-stuck row isn't recounted once per pass.
  const skippedIds = new Set<string>();

  // Always re-fetches from the top: a migrated row stops matching the LIKE
  // filter, so the next page naturally shifts down to cover new ground —
  // no offset bookkeeping needed. A page where nothing migrated would just
  // return the same skipped rows forever, so that's the stop condition.
  for (;;) {
    const page = await fetchPageToBackfill(supabase);
    if (page.length === 0) break;

    let migratedThisPage = 0;
    for (const row of page) {
      const mirroredUrl = await coverMirror.mirror(
        row.cover_url as string,
        row.mb_release_group_id,
        { supabase }
      );
      if (!mirroredUrl) {
        skippedIds.add(row.mb_release_group_id);
        continue;
      }

      // A failed write leaves cover_url pointing at Cover Art Archive
      // still, so it's counted as skipped rather than migrated — the row
      // stays selected on the next run instead of the summary lying about it.
      const { error: updateError } = await supabase
        .from("albums")
        .update({ cover_url: mirroredUrl })
        .eq("mb_release_group_id", row.mb_release_group_id);
      if (updateError) {
        skippedIds.add(row.mb_release_group_id);
        continue;
      }
      migrated++;
      migratedThisPage++;
    }

    if (migratedThisPage === 0) break;
  }

  return { migrated, skipped: skippedIds.size };
}
