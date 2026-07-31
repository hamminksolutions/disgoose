import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin dev-resource requests by default. The e2e
  // suite (playwright.config.ts) and supabase/config.toml's site_url both
  // hit the dev server via 127.0.0.1, a different origin string than
  // localhost even though it's the same host — without this, client JS
  // never hydrates there and every plain onSubmit/onClick handler silently
  // falls back to native browser behavior.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
