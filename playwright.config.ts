import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Default 30s is too tight once several specs run in parallel against one
  // shared dev server, each doing real network round-trips (MusicBrainz
  // search, Mailpit) — observed a spurious timeout at the default before
  // this was raised, with the same spec passing comfortably in isolation.
  timeout: 60_000,
  retries: 0,
  reporter: "list",
  use: {
    // Matches supabase/config.toml's [auth] site_url — Supabase's own
    // signup/reset email links redirect here after verifying, so the dev
    // server under test must run on this exact port.
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
