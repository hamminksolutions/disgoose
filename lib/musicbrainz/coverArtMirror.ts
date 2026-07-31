import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "covers";

export function createCoverArtMirror(fetchImpl: typeof fetch) {
  return {
    async mirror(
      coverArtUrl: string,
      mbReleaseGroupId: string,
      { supabase }: { supabase: SupabaseClient }
    ): Promise<string | null> {
      try {
        const response = await fetchImpl(coverArtUrl);
        if (!response.ok) return null;

        const blob = await response.blob();
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(mbReleaseGroupId, blob, {
            contentType: blob.type || "image/jpeg",
            upsert: true,
          });
        if (error) return null;

        return supabase.storage.from(BUCKET).getPublicUrl(mbReleaseGroupId).data.publicUrl;
      } catch {
        // A mirroring failure is never fatal to a search — fall back to none.
        return null;
      }
    },
  };
}
