// One-off verification route for issue #35: hit this once after the Sentry
// DSN is configured to confirm a server error actually reaches the Sentry
// dashboard. Not used by the app itself. Deliberately left unhandled (no
// try/catch, unlike other routes) — the uncaught throw is what reaches
// instrumentation.ts's onRequestError hook.
export async function GET() {
  throw new Error("Sentry test error (from GET /api/sentry-test-error)");
}
