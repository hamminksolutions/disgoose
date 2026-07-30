# Disgoose

Music rating platform: users rate albums (1.0–10.0), optionally with a review, and see their taste reflected as a grid of covers on their profile.

## Language

**Album**:
A MusicBrainz release-group. Each release-group is its own, independently ratable album — there is no merge logic for different editions (e.g. standard vs. deluxe) of what a human would consider "the same album". See [ADR-0001](docs/adr/0001-no-edition-merging.md).
_Avoid_: Release, pressing (that's a release, one level deeper than release-group — not what we mean by "album")

**Rating**:
One user's evaluation of one album: score (1.0–10.0), listen method, optional review text. One Rating per (user, album) pair — re-rating overwrites the existing Rating, it is not a new entry.

**Grid**:
The 5×8 view of a user's 40 most recent Ratings, ordered by the Rating's `created_at` (moment of first rating). Editing an existing Rating (score/review/listen method) never changes its position in the Grid — only a new first-time rating of a different album can push the oldest Rating out of the Grid.
_Avoid_: "recently rated" without specifying created_at vs updated_at
