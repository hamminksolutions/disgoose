# Technical Plan — Music Rating Platform (v1)

## 1. High-level architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│   Frontend       │◄────►│  Backend / API layer │◄────►│  Own database        │
│   (Next.js)      │      │  (Next.js API routes │      │  (Postgres/Supabase) │
│                  │      │   or separate backend)│      │  users/albums/ratings│
└─────────────────┘      └──────────┬───────────┘      └─────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  External data sources│
                          │  MusicBrainz (search) │
                          │  Cover Art Archive    │
                          │  (covers)             │
                          └──────────────────────┘
```

Core principle: **your own database is the source of truth for everything users do** (ratings, reviews, profiles). External sources (MusicBrainz/Cover Art Archive) are only used to *find* and *cache* albums — your app must keep working (for existing data) if those external services are briefly down.

## 2. Stack proposal

- **Frontend + backend:** Next.js (React) — one framework for both UI and API routes, well documented, and this is where Claude Code is strongest in terms of training data and conventions.
- **Database + auth:** Supabase (managed Postgres + built-in auth) — saves you from building your own auth system in v1, and immediately gives you a hostable Postgres database.
- **Hosting:** Vercel for the Next.js app (native integration), Supabase hosts the database itself.
- **Styling:** Tailwind CSS — matches what Claude Design/Claude Code can generate and maintain well by default.

**Why not Spotify or Last.fm as the primary data source:**

*Spotify* significantly restricted access to its metadata endpoints via the Client Credentials flow in February 2026, and now requires a Premium account for Developer Mode usage. That means mandatory OAuth per user and dependence on policy that can apparently change quickly and unilaterally — that's the biggest risk, bigger than occasional album takedowns. On top of that: contractual restrictions on reuse/caching of content, and region-dependent availability.

*Last.fm* is not a wrapper around MusicBrainz — it's a separate system that optionally accepts a MusicBrainz ID. It has a long-standing, unresolved problem with frequently missing or incorrect album covers in the API response, which makes it unsuitable as a primary source for a product where the cover is the central visual element. Still usable as a later addition (tags, community listen counts).

For v1, MusicBrainz + Cover Art Archive is therefore the best choice: freely accessible, no rate limiting on cover art, no user authentication required, and an explicit release-group concept that helps merge reissues of the same album.

**Future-proofing:** build the `albums` table (see section 4) with room for multiple external IDs alongside `mb_release_group_id` (e.g. a nullable `spotify_id`/`lastfm_url`), so a possible later expansion to Spotify (e.g. for scrobbling in v2) doesn't require a painful migration.

## 3. Data source integration: MusicBrainz + Cover Art Archive

- **Search:** `https://musicbrainz.org/ws/2/release-group/?query=...&fmt=json` — search at the **release-group** level (the "album" itself), not the **release** level (a specific pressing/reissue), otherwise you get duplicates of the same album in results.
- **Covers:** Cover Art Archive, linked via MBID. Not every release-group has art — build in a fallback placeholder.
- **Important:** MusicBrainz asks for a proper `User-Agent` header with your app name and contact info, and expects reasonable use (no abuse with bursts of requests). Cache aggressively in your own database, therefore: once an album has been looked up/added by a user, store title/artist/cover URL locally so you don't query MusicBrainz/Cover Art Archive again on every profile view.
- **Cover hosting:** covers are mirrored to Supabase Storage on first cache of an album, not linked directly to Cover Art Archive. See [ADR-0004](adr/0004-mirror-cover-art-to-own-storage.md) for why the original "direct linking is fine for v1" call was reversed. Albums already cached from the PoC period (still pointing directly at Cover Art Archive) are migrated by a one-off backfill script run once before launch — not a lazy re-mirror on next access, since the PoC-era cache is small enough that a bounded one-time pass is simpler than adding self-healing logic to the read path.

## 4. Data model (v1)

```sql
users
  id              uuid primary key
  email           text unique
  username        text unique
  created_at      timestamptz

albums
  id                    uuid primary key
  mb_release_group_id   text unique   -- MusicBrainz ID (primary source in v1)
  spotify_id            text nullable unique  -- reserved for later expansion, not used in v1
  lastfm_url            text nullable         -- reserved for later expansion, not used in v1
  title                 text
  artist                text
  cover_url             text nullable   -- points at Supabase Storage (mirrored), not Cover Art Archive directly — see ADR-0004
  cached_at             timestamptz

ratings
  id             uuid primary key
  user_id        uuid references users(id)
  album_id       uuid references albums(id)
  score          integer         -- stored as tenths, e.g. 85 = 8.5, avoids rounding errors
  listen_method  text            -- enum: spotify | cd | vinyl | streaming_other | other
  review_text    text nullable   -- visible to any visitor's profile view for score/listen_method; review_text itself only to the owner and accepted Friends (see friendships below, CONTEXT.md)
  created_at     timestamptz
  updated_at     timestamptz
  unique (user_id, album_id)     -- enforces: one rating per album per user

friendships
  id             uuid primary key
  requester_id   uuid references users(id) on delete cascade
  addressee_id   uuid references users(id) on delete cascade
  status         text            -- enum: pending | accepted
  created_at     timestamptz
  check (requester_id != addressee_id)  -- no self-requests
  unique (requester_id, addressee_id)  -- a request is either pending or accepted; declining/unfriending deletes the row (silent, no notification — see CONTEXT.md and ADR-0005)
```

`POST /api/friend-requests` (section 5) must check for an existing reverse-direction pending row (`addressee_id = <me>, requester_id = <them>`) before inserting: if one exists, update it to `accepted` instead of inserting a new row — two independently-sent requests between the same pair resolve straight to a Friendship rather than sitting as two unrelated pending rows.

## 5. API layer (own backend endpoints)

- `GET /api/albums/search?q=...` → proxies to MusicBrainz, caches results. Rate-limited per IP (v1: a simple fixed-window limit, e.g. 20 req/min) — both to respect MusicBrainz's "reasonable use" etiquette and because this endpoint is reachable by anyone, not just logged-in users.
- `POST /api/ratings` → creates or updates (upserts) a rating for the logged-in user. Rate-limited per user to blunt scripted spam.
- `GET /api/users/:username/profile` → **public, no auth required** (v1 adds a public read-only profile view). Fetches the user + their ratings for the grid: `ORDER BY created_at DESC LIMIT 40`. Returns score + listen method for every rating regardless of viewer; review text is included only if the viewer is the owner or an accepted Friend (see `friendships`, section 4) — otherwise omitted from the response, not just hidden client-side. Important: this shows only the 40 most recent ratings; older ratings are **not** deleted, just not shown in the grid. Put an index on `ratings(user_id, created_at)` so this query stays fast as users rate more than 40 albums.
- `GET /api/users/:username/ratings` → *all* ratings of a user (for the list view), paginated (e.g. 20-50 per page) and sortable (newest first / highest rated first). Same underlying data as the grid query, but without the LIMIT 40 and with pagination. Owner-only in v1 (no public paginated list view — public visitors only get the grid).
- `GET /api/ratings/:id` → detail of a single rating (album + score + listen method + full review text) for the album detail popup. Same visibility rule as the profile endpoint: review text only for the owner or an accepted Friend.
- `PUT /api/ratings/:id` → changes the score, listen method, and/or review of an existing rating (separate from the upsert-on-re-rating logic in `POST /api/ratings`).
- `DELETE /api/ratings/:id` → deletes a rating entirely; the album itself stays in the `albums` cache (which is shared between users).
- `POST /api/friend-requests` → sends a Friend Request to a user (found by username search, same search UX pattern as album search).
- `POST /api/friend-requests/:id/accept` → accepts a pending request, turning it into a Friendship (`status: accepted`).
- `DELETE /api/friend-requests/:id` → declines a pending request, or ends an existing Friendship — same endpoint either way, since both are a plain delete of the `friendships` row. Silent: no notification to the other party (see ADR-0005).
- `DELETE /api/account` → deletes the logged-in user's account and all owned data (cascades to `ratings` and `friendships` via foreign keys) — GDPR right-to-erasure, self-service.

**Listen method:** established as a fixed, manually selectable list of icons (spotify/cd/vinyl/streaming_other/other) — no automatic detection. This keeps the `listen_method` enum in the data model (section 4) simple and avoids unnecessary complexity (e.g. link recognition) that isn't needed for v1.

By proxying yourself (instead of letting the frontend query MusicBrainz directly), you keep control over caching, rate-limiting etiquette, and can later easily switch data sources without changing the frontend.

## 6. Non-functional requirements

- **Resilience:** if MusicBrainz/Cover Art Archive is temporarily unreachable, the app must still show existing profiles/grids (since that data lives in your own database) — only *adding new albums* fails temporarily. Already handled in the UI (retry affordance on search failure).
- **Performance:** the grid loads 40 covers at once — use image lazy-loading and Next.js's built-in image optimization, now straightforward since covers are mirrored to Supabase Storage (ADR-0004) instead of an external host.
- **Privacy/GDPR:** the production Supabase project is provisioned in the EU region (confirmed). A minimal privacy statement is needed, and account deletion (`DELETE /api/account`, section 5) is self-service, not a manual support task.
- **Observability:** error tracking (e.g. Sentry) so a production failure (an unhandled MusicBrainz timeout, a failed cover upload) surfaces as an alert, not a support ticket.
- **CI:** lint, typecheck, and `vitest run` on every PR before merge.
- **Environments:** a separate staging Supabase project, distinct from production, so schema migrations are tried against non-production data first.

## 7. Testing strategy

Build with test-driven development (red-green-refactor) for the core logic (specifically the rating upsert logic and the MusicBrainz response mapping). See the separate document on Claude Code skills — the `/tdd` skill enforces this pattern so Claude Code doesn't just ship untested code.

v1 adds a small Playwright e2e suite on top of the existing vitest unit tests, covering the handful of paths that cross layers in ways unit tests can't catch — register/login, add an album, see it in the grid, and the friend-accept → review-becomes-visible flow. Runs in CI (section 6) on every PR.

## 8. Open technical questions — resolved during the v1 grilling session

- **Scalability of caching:** `ON CONFLICT DO NOTHING` / upsert logic on the `albums` unique constraint. Already implemented.
- **Moderation of review text:** no automated filtering for v1 — exposure is low (no discovery surface beyond a direct profile link, and review text itself is now further gated to accepted Friends only, see ADR-0005). Handle abuse manually via the Supabase dashboard if it ever comes up; revisit if real usage shows a need.
- **What if an album isn't in MusicBrainz:** stays out of scope — see [ADR-0002](adr/0002-no-manual-album-entry.md).
- **Where does your app run:** Vercel + Supabase confirmed. Production Supabase project is live (EU region, linked to `hamminksolutions/disgoose`).
