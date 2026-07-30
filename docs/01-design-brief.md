# Design Brief — Music Rating Platform (v1) — for Claude Design

## 1. The product in one sentence
A platform where music lovers rate albums (1-10, with decimals), optionally review them, and visually display their taste via a 5×8 grid of covers on their profile — RateYourMusic's data depth, Letterboxd's modern look, Topsters' grid visualization.

## 2. Target audience
Music nerds/collectors: people who already use RYM, Discogs, or Last.fm. They're critical, love data/detail, but are tired of RYM's dated UI.

**Decided:** the platform goes for the *light/social* direction — a Letterboxd feel, not RYM/Pitchfork authority. Concretely, that means: warmer, more inviting colors than pure black-and-white data, room for personality (e.g. a playful empty-state illustration instead of a bare notice), and a tone that's "fun to share" rather than "institute of music knowledge". This is an important steer for Claude Design: don't ask for a dashboard-like, data-dense UI, but for something warm and personal — the data (scores, reviews) is there, but isn't the focal point of the tone.

## 3. Competitive analysis — what works, what doesn't

| Platform | Strengths | Weaknesses | Relevance to you |
|---|---|---|---|
| **RateYourMusic** | Extreme data depth, credibility within the community, clear rating culture | Dated, dense UI; feels like a forum from 2008; poor on mobile | Your direct competitor — look at their album and profile pages as a baseline, but modernize radically |
| **Letterboxd** (film equivalent) | Poster grid as the visual core of the profile, warm/friendly color palette (orange/green accents), strong "diary" timeline, excellent mobile app | Less data depth than RYM | **Best direct design reference.** Their profile page with a poster grid is, in setup, almost 1-to-1 what you want with album covers |
| **Topsters** | The grid itself is the complete product — sleek, covers take center stage, little UI noise around it | No underlying rating system, static | Adopt the "covers as the main act, minimal chrome around it" philosophy for your grid component |
| **Last.fm / stats.fm** | Strong data visualization of listening behavior (charts, stats) | Feels clinical, no personal opinion/curation at the center | Inspiration for possible later stats features, not for v1 |
| **Discogs** | Clear, functional detail pages per release/pressing | Marketplace feel, little personality | Mainly relevant for "how to display release data neatly", not for tone |

**Concrete action:** take a look at a few Letterboxd profiles (web) side by side with RYM profiles yourself — the difference between "this feels like 2026" and "this feels like 2010" mostly comes down to: whitespace, typography, and how prominent the poster/cover is relative to text.

## 4. What's happening now (2026) in app design — and what's relevant to you

From research into current UI/UX trends:

- **Dark mode as a first-class citizen, not a separate toggle.** Not just inverted colors — a deliberate dark palette with good contrast ratios. For a music app (album covers, used in the evening), dark-mode-first is an obvious choice.
- **Bento grids** — exactly your use case. Grid-based layouts with boxes of varying sizes are a dominant trend; your 5×8 album grid fits naturally here and could even serve as the platform's visual "signature".
- **Data storytelling** — making numbers and statistics visual instead of a bare table. Relevant to how you show the score (1-10) on/near the cover, and later for any profile statistics.
- **Low-stimulus / calm UI** — minimalism, plenty of whitespace (or in this case: "blackspace"), no superfluous decoration. Fits the "serious music connoisseur" tone.
- **Glassmorphism/"Liquid Glass"** — use sparingly, only for overlays (e.g. the rating-input screen over a cover), not everywhere.
- **Thumb-friendly, mobile-first layout** — important assumption to check (see questions at the end): will this be primarily a mobile or desktop experience?

**Proposed visual direction:** a dark base canvas (near-black, not pure `#000`) remains a good starting point — dark mode is both a trend and functionally fitting for a music app — but combined with the chosen social/light tone, this won't become a cold dashboard look. Covers remain the main characters (large, sharp, little framing), but with a warmer, friendlier accent color palette (think of Letterboxd's use of orange/green as recognizable, inviting accents, not a clinical system color), rounder corners, and a bit more "air" between elements than a pure data tool would have. Typography: a friendlier, slightly rounder title font combined with a neutral, readable text font — less "music magazine sleek", more "fun to hang out in".

**Mobile and desktop equally important:** this is not a mobile-first-with-desktop-as-an-afterthought project — both platforms matter equally. Concretely, this means for Claude Design: deliver both a mobile and a desktop variant of every screen, and think from the start about how the 5×8 grid reflows on a narrow screen (e.g. a grid that becomes narrower on mobile, like 4 or 5 columns instead of 8, with more rows) without losing the "5×8" concept as a promise.

## 5. Screens needed for v1

1. **Onboarding / login** — simple, fast, low friction
2. **Profile page** — the core: a 5×8 grid of covers+scores at the top, sort option (newest/highest rated), user info
3. **"Add album" flow** (probably as a modal/overlay, not a separate page) — search field → results list from MusicBrainz → select album → give a score (1-10, decimals — think about a slider vs. numeric input field) → choose listen method (icons: Spotify/CD/vinyl/streaming other/other) → optional review text → save
4. **Album detail popup** — appears when you click a cover in the grid (or in the list view). Shows the score, listen method, and the full review text. Important: the review is *not* visible in the grid itself (which only shows cover + score) — only in this popup.
5. **List view of all ratings** — a separate view (apart from the 5×8 grid) where *all* of a user's ratings can be found, including older ratings that have "fallen out" of the grid after the 40th album. Probably a simple list, sortable chronologically or by score (cover thumbnail + title + score per row), reachable via a link/tab from the profile.
6. **Empty profile state** — important and often forgotten: what does the grid look like with 0 albums? This is the first thing a new user sees.

## 6. Components to design

- Grid cell (cover + score overlay, hover/tap state)
- Rating input component (slider or stepper for 1-10 with 1 decimal)
- Listen-method icon set — a fixed, manually selectable set (Spotify/CD/vinyl/streaming other/other); this is a visible, recognizable set of icons, not a bare dropdown — fits the light/social tone
- Album search-result row (cover thumbnail + title + artist)
- Album detail popup with edit and delete actions (score/listen method/review adjustable, rating deletable)
- Empty-state illustration/component

## 7. What I would ask Claude Design

Give Claude Design this document plus explicitly: "design the 5 screens from section 5, with the components from section 6, in the visual direction from section 4 — start with the profile page, since that has to prove the grid concept."

## 8. Hard questions to still ask yourself (and me)
- Do you allow a grid of 40 cells to stay empty if someone hasn't rated 40 albums yet, or do you fill it with placeholders? This has direct visual impact.
- **Decided:** on the 41st album, the oldest album falls out of the *grid* (only the 40 most recent ratings are visible in the grid). All ratings — including older ones — remain findable via the separate list view (screen 5). Think about how you make the grid limit visually clear, and how prominent the link to the full list is (a small "view all" link below the grid seems obvious).
- **Decided:** review text is never visible in the grid itself — only cover + score. The review is only shown in the album detail popup (screen 4).
- Do you show only your own profile in v1, or should the grid also be viewable publicly/by others? That changes whether you need a "shared link" view.
