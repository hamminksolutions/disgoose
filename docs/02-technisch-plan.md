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
- **Cover hosting:** consider whether you link covers directly to Cover Art Archive URLs (simple, but dependent on their uptime) or mirror them yourself to your own storage (more robust, but more work/cost). For v1: direct linking is fine, with caching of the URL in your database.

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
  cover_url             text nullable
  cached_at             timestamptz

ratings
  id             uuid primary key
  user_id        uuid references users(id)
  album_id       uuid references albums(id)
  score          integer         -- stored as tenths, e.g. 85 = 8.5, avoids rounding errors
  listen_method  text            -- enum: spotify | cd | vinyl | streaming_other | other
  review_text    text nullable
  created_at     timestamptz
  updated_at     timestamptz
  unique (user_id, album_id)     -- enforces: one rating per album per user
```

## 5. API layer (own backend endpoints)

- `GET /api/albums/search?q=...` → proxies to MusicBrainz, caches results
- `POST /api/ratings` → creates or updates (upserts) a rating for the logged-in user
- `GET /api/users/:username/profile` → fetches the user + their ratings for the grid: `ORDER BY created_at DESC LIMIT 40`. Important: this shows only the 40 most recent ratings; older ratings are **not** deleted, just not shown in the grid. Put an index on `ratings(user_id, created_at)` so this query stays fast as users rate more than 40 albums.
- `GET /api/users/:username/ratings` → *all* ratings of a user (for the list view), paginated (e.g. 20-50 per page) and sortable (newest first / highest rated first). Same underlying data as the grid query, but without the LIMIT 40 and with pagination.
- `GET /api/ratings/:id` → detail of a single rating (album + score + listen method + full review text) for the album detail popup. Note: only relevant to the owner in v1 (there is no public profile view), so this endpoint must check that the requested rating belongs to the logged-in user.
- `PUT /api/ratings/:id` → changes the score, listen method, and/or review of an existing rating (separate from the upsert-on-re-rating logic in `POST /api/ratings`).
- `DELETE /api/ratings/:id` → deletes a rating entirely; the album itself stays in the `albums` cache (which is shared between users).

**Listen method:** established as a fixed, manually selectable list of icons (spotify/cd/vinyl/streaming_other/other) — no automatic detection. This keeps the `listen_method` enum in the data model (section 4) simple and avoids unnecessary complexity (e.g. link recognition) that isn't needed for v1.

By proxying yourself (instead of letting the frontend query MusicBrainz directly), you keep control over caching, rate-limiting etiquette, and can later easily switch data sources without changing the frontend.

## 6. Non-functional requirements

- **Resilience:** if MusicBrainz/Cover Art Archive is temporarily unreachable, the app must still show existing profiles/grids (since that data lives in your own database) — only *adding new albums* fails temporarily.
- **Performance:** the grid loads 40 covers at once — use image lazy-loading and possibly Next.js's built-in image optimization.
- **Privacy/GDPR:** you store personal data (email) of EU users — choose a Supabase region in the EU, and think about a minimal privacy statement, even though this is "just" an MVP.

## 7. Testing strategy

Build with test-driven development (red-green-refactor) for the core logic (specifically the rating upsert logic and the MusicBrainz response mapping). See the separate document on Claude Code skills — the `/tdd` skill enforces this pattern so Claude Code doesn't just ship untested code.

## 8. Open technical questions (hard, but important)

- **Scalability of caching:** what do you do if two users simultaneously add the same new album that isn't in your `albums` table yet — a race condition on the unique constraint? (Answer: `ON CONFLICT DO NOTHING` / upsert logic, but this must be built deliberately, not forgotten.)
- **Moderation of review text:** even though this is v1 with few users — will you do any basic content filtering (spam/abuse), or knowingly accept that risk for now?
- **What if an album isn't in MusicBrainz** (very obscure or very new releases)? Do you build a "manually add without MBID" fallback, or accept that gap in v1?
- **Where does your app run** — is a Vercel/Supabase combo acceptable to you cost-wise long-term, or do you deliberately want to stay vendor-independent from day one? That significantly changes the technical choices in section 2.
