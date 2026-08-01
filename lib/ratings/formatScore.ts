/** Renders a stored score (1–100) as the user-facing 1.0–10.0 scale. */
export function formatScore(score: number) {
  return (score / 10).toFixed(1);
}
