# Friendship is a review-visibility gate, not a social feature

`03-poc-requirements-claude-code.md` explicitly excluded "following other users / social feed" from v1, to stop Claude Code from pre-building social infrastructure the PoC didn't need. Moving to v1, a **Friendship** concept is introduced (mutual, formed via a Friend Request + acceptance — see [CONTEXT.md](../../CONTEXT.md)), which sits close enough to that excluded territory that a future reader could reasonably assume it's the first step toward a follow/feed system. It deliberately is not.

Friendship's only effect is access control: it grants visibility into a Friend's review text on their Ratings. It does nothing else — no activity feed, no "X just rated Y" notifications, no feed of friends' recent activity, no asymmetric following. The Grid, score, and listen method stay public to any visitor regardless of Friendship; only review text is gated. Declining a Friend Request or ending a Friendship is silent (no notification to the other party) — this keeps the feature to exactly one job (privacy control on review text) rather than growing into a notifications/activity system.

If a future version wants an activity feed or following, that is a new decision, not an extension of this one — Friendship's data model (a simple mutual-relationship table) was chosen for the access-control job, not for feed fan-out.
