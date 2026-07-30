type CoverArtImage = {
  front: boolean;
  image: string;
};

export function createCoverArtClient(fetchImpl: typeof fetch) {
  return {
    async getCoverUrl(mbReleaseGroupId: string): Promise<string | null> {
      try {
        const response = await fetchImpl(
          `https://coverartarchive.org/release-group/${mbReleaseGroupId}`
        );

        if (!response.ok) {
          // Most commonly a 404 — this release-group simply has no art.
          return null;
        }

        const body = (await response.json()) as { images: CoverArtImage[] };
        const front = body.images.find((image) => image.front) ?? body.images[0];
        return front?.image ?? null;
      } catch {
        // A missing cover is never fatal to a search — fall back to none.
        return null;
      }
    },
  };
}
