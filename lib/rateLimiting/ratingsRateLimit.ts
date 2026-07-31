// Anti-spam threshold for rating create/update, shared between POST
// /api/ratings and PUT /api/ratings/:id (docs/agents issue #22: 20
// requests/5 minutes per user, via a Postgres UPSERT counter).
export const RATINGS_RATE_LIMIT = { limit: 20, windowSeconds: 300 };

export function ratingsRateLimitKey(userId: string): string {
  return `ratings:${userId}`;
}
