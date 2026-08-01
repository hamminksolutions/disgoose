"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    // global-error must include html and body tags — it replaces the root
    // layout when active, so it doesn't inherit its fonts/globals.css.
    <html>
      <body>
        <h2>Something went wrong!</h2>
      </body>
    </html>
  );
}
