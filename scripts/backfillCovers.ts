import { createAdminSupabaseClient } from "../lib/supabase/admin";
import { createCoverArtMirror } from "../lib/musicbrainz/coverArtMirror";
import { backfillCoverArt } from "../lib/musicbrainz/backfillCoverArt";

// One-off: re-mirrors every PoC-era `albums` row still pointing directly at
// Cover Art Archive into Supabase Storage. Not part of the app's request
// path — run once before v1 launch (see issue #29).
async function main() {
  const supabase = createAdminSupabaseClient();
  const coverMirror = createCoverArtMirror(fetch);

  const { migrated, skipped } = await backfillCoverArt({ supabase, coverMirror });
  console.log(`Backfill complete: ${migrated} cover(s) migrated, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
