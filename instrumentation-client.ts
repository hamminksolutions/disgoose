import * as Sentry from "@sentry/nextjs";

// Runs before hydration (see instrumentation-client.js docs) — the earliest
// point client-side errors can be captured. No-ops safely if the DSN isn't
// set (e.g. local dev without a Sentry project configured).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
