# Disgoose

Music rating platform: users rate albums (1.0–10.0), optionally with a review, and see their taste reflected as a grid of covers on their profile.

## Language

**Album**:
A MusicBrainz release-group whose primary-type is `Album` or `EP`. Each release-group is its own, independently ratable album — there is no merge logic for different editions (e.g. standard vs. deluxe) of what a human would consider "the same album". See [ADR-0001](docs/adr/0001-no-edition-merging.md). Release-groups of other primary-types (Single, Broadcast, Other) — and any with a missing/unrecognized primary-type — are not ratable and never surface in search.
_Avoid_: Release, pressing (that's a release, one level deeper than release-group — not what we mean by "album"); Single (a distinct, excluded release-group type, not a kind of Album)

**Rating**:
One user's evaluation of one album: score (1.0–10.0), listen method, optional review text. One Rating per (user, album) pair — re-rating overwrites the existing Rating, it is not a new entry. Score and listen method are visible to any visitor of the profile; review text is visible only to the rating owner and their Friends (see Friendship).

**Grid**:
The 5×8 view of a user's 40 most recent Ratings, ordered by the Rating's `created_at` (moment of first rating). Editing an existing Rating (score/review/listen method) never changes its position in the Grid — only a new first-time rating of a different album can push the oldest Rating out of the Grid. The Grid itself (covers + scores) is public to any visitor, regardless of Friendship.
_Avoid_: "recently rated" without specifying created_at vs updated_at

**Friendship**:
A mutual relationship between two Users, formed when one sends a Friend Request and the other accepts it. Grants each User visibility into the other's review text on every Rating. Does not affect visibility of the Grid, score, or listen method — those are public regardless of Friendship.
_Avoid_: Follow, Following (asymmetric relationships — not used here, Friendship is always mutual)

**Friend Request**:
A pending, one-directional invitation from one User to another to form a Friendship. Declining a Friend Request or ending an existing Friendship is silent — the other party receives no notification of either. A User cannot send one to themselves. Sending one to a User who already has a pending Friend Request open toward you immediately resolves both into an accepted Friendship, rather than leaving two independent pending rows.
