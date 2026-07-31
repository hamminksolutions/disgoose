# Artist-first search ranking

MusicBrainz's release-group text search returns a relevance `score`, but that score is pure Lucene text-match quality — it has no concept of popularity, and it doesn't distinguish "this result's artist is the thing you searched for" from "this result's title happens to contain your search text." In practice this meant a search for e.g. "Radiohead" surfaced exact-title matches (an unrelated artist's album literally titled "Radiohead", tribute compilations, cover albums) ahead of the band's own famous discography, which often didn't appear on the results page at all.

Since MusicBrainz exposes no popularity/prominence signal anywhere in its API (confirmed against its docs — only sparse, community-added tags exist), fixing this requires asking a different question than "what text matches best": first identify the artist entity the query names, then show that artist's own catalog. `searchReleaseGroups()` now:

1. Runs the existing free-text release-group search and a new artist search (`/ws/2/artist`) in parallel.
2. Looks for an artist whose name or sort-name exactly equals the trimmed, case-insensitive query. No exact match → behavior is unchanged from before (plain text-search results only).
3. Among exact-name matches (same-named artists exist — MusicBrainz has no popularity field to rank them by fame), picks the one with the highest artist-search score, then the one without a `disambiguation` comment (an existing MusicBrainz editorial convention: less-prominent same-named entities get a clarifying comment, the default one usually doesn't).
4. Fetches that artist's release-groups via `/ws/2/release-group?artist=<mbid>`, filters to Album/EP, sorts chronologically by `first-release-date` (undated last).
5. Returns that discography first, followed by the general search results with anything already shown removed.

Any failure in the artist-search or discography-browse step (or the matched artist having no ratable release-groups) falls back silently to the plain text-search results — only the general search failing surfaces the existing error to the user. This triples the MusicBrainz calls a search can make (general search + artist search always, browse conditionally), which is an accepted cost for a text search whose whole purpose is finding the right artist and their albums.

Knowingly out of scope: this doesn't help a query that isn't an artist's exact name (e.g. "radiohead live" or a misspelling) — those still rely on plain text relevance, same as before.
