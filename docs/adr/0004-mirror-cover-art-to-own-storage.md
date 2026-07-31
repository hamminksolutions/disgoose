# Mirror cover art to own storage instead of direct-linking

`02-technisch-plan.md` originally settled on direct-linking cover URLs from Cover Art Archive for v1 ("direct linking is fine, with caching of the URL in your database") — reasonable for a PoC with a handful of users. Moving to v1, this is reversed: on first cache of an album, the cover image is downloaded once and stored in Supabase Storage; `albums.cover_url` now points at that own-storage location, not at `coverartarchive.org`.

Reason for the reversal: the profile grid loads 40 covers per view, directly from a third-party archive whose uptime/latency Disgoose has no control over — visually, the whole app degrades (broken images across the grid) whenever Cover Art Archive hiccups, even though the app's own database and API are fine. Mirroring is a small extension of the caching that already happens (`albums.cached_at`), and lets covers be served through Next.js's own image optimization (resizing for grid thumbnails vs. the full-size popup) instead of whatever format Cover Art Archive happens to return.

Consequence: adding an album now does one extra write (image download + storage upload) beyond the existing metadata cache. Existing cached rows created before this decision point at Cover Art Archive directly and need a backfill migration to re-point them at mirrored copies.
