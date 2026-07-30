# PoC Requirements — Music Rating Platform v1

> This document is meant to be given to Claude Code as a starting point. It's supported by `02-technisch-plan.md` (architecture/data-model detail) and `01-design-brief.md` (visual direction, still to be filled in with output from Claude Design).

## 1. Goal of this PoC
A working proof-of-concept in which a user: creates an account, searches for and adds an album with score + listen method + optional review, and views their profile as a 5×8 grid of covers with scores.

## 2. In scope for v1
- [ ] Registration/login (email-based via Supabase Auth)
- [ ] Album search against MusicBrainz (release-group level), with caching in the own database
- [ ] Add rating: score (1.0–10.0, one decimal), listen method (spotify/cd/vinyl/streaming_other/other), optional review text
- [ ] One rating per album per user — re-rating = update, not a new entry
- [ ] Profile page with 5×8 grid (40 cells), sorted by most recently rated
- [ ] With more than 40 ratings: only the 40 most recent are visible in the grid (older ratings still exist in the database — nothing is deleted, just not shown)
- [ ] List view of *all* of the user's ratings (separate from the grid), so older ratings that fell out of the grid remain findable
- [ ] Album detail popup: appears when clicking a cover (in the grid or list), shows score + listen method + full review text. The review is thus not visible anywhere except in this popup — not in the grid, not in the list view (there, only cover/title/score)
- [ ] Editing and deleting a rating: from the album detail popup the user can adjust score, listen method, and review at any time, or delete the entire rating
- [ ] Empty-state view if a user has no (or fewer than 40) ratings yet

## 3. Explicitly out of scope for v1 (don't build, don't "conveniently pre-build" either)
- Following other users / social feed
- Comments/likes on other people's reviews
- Linking a Spotify account or automatic scrobbling
- Public shareable profile links for logged-out visitors
- Statistics/charts about listening behavior
- Native mobile app (this is a web app in v1)

*(Reason to state this explicitly: prevent Claude Code from "conveniently" building infrastructure for later features — that slows down the PoC and adds unnecessary complexity.)*

## 4. Data model
See `02-technisch-plan.md` section 4 for the full schema (`users`, `albums`, `ratings`).

## 5. Acceptance criteria (how do you know the PoC works?)
1. I can create an account and log in.
2. I can search for an album by title/artist and see relevant results with cover (if available).
3. I can add an album with a score, listen method, and optional review, and see it immediately reflected in my grid.
4. If I rate the same album again, my previous rating is overwritten (no duplicate in the grid).
5. My profile page shows a 5×8 grid of covers with the given score visible per cover.
6. If I've rated fewer than 40 albums, the grid still looks tidy (no broken layout).
7. If I rate a 41st album, my oldest (by rating date) rating automatically falls out of the visible grid — that rating stays saved in the database, only the grid query shows just the 40 most recent.
8. I can view a full list of all my ratings via a link/tab from my profile, including the ratings no longer in the grid.
9. If I click on an album (in the grid or in the list), I see a popup with the score, the listen method, and my full review — that review isn't visible anywhere else.
10. From that popup I can adjust the score, the listen method, and the review, or delete the entire rating — a changed score is immediately visible in the grid/list.

## 6. Technical constraints (fixed, not up for discussion in the PoC phase)
- Stack: Next.js + Tailwind CSS + Supabase (Postgres + Auth)
- Data source for albums: MusicBrainz API + Cover Art Archive (no Spotify integration in v1)
- Hosting: Vercel (frontend/API) + Supabase (database/auth)

## 7. Suggested build order
1. Project skeleton + Supabase connection + auth (register/login works)
2. Data model migrations (`albums`, `ratings` tables)
3. `/api/albums/search` endpoint with MusicBrainz proxy + caching
4. "Add album" flow (UI + saving to `ratings`)
5. Profile page with grid component
6. Album detail popup (score, listen method, full review)
7. List view of all ratings (paginated)
8. Empty state and edge cases (no cover available, <40 albums, etc.)

## 8. Open questions Claude Code will probably ask you (prepare for these)
- Exact visual style of the grid and the rating input (→ answer with output from Claude Design once available)
- How should an expired/failed MusicBrainz call be shown in the UI (error message, retry button, silently show nothing)?
- Should the review text have a character limit?
