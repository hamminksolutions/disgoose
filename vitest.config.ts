import { defineConfig, configDefaults } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" });

export default defineConfig({
  test: {
    environment: "node",
    // e2e/**.spec.ts are Playwright tests (see playwright.config.ts) — they
    // use Playwright's `page` fixture, which vitest doesn't provide.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
