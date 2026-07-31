import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { checkRateLimit } from "./checkRateLimit";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("checkRateLimit", () => {
  it("allows a request when the key is under the limit", async () => {
    const supabase = createTestSupabaseClient();
    const key = `test:${randomUUID()}`;

    const result = await checkRateLimit(
      { key, limit: 20, windowSeconds: 300 },
      { supabase }
    );

    expect(result).toEqual({ limited: false, count: 1 });
  });

  it("rejects once the key exceeds the limit within the same window", async () => {
    const supabase = createTestSupabaseClient();
    const key = `test:${randomUUID()}`;

    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(
        { key, limit: 3, windowSeconds: 300 },
        { supabase }
      );
      expect(result).toEqual({ limited: false, count: i + 1 });
    }

    const fourth = await checkRateLimit(
      { key, limit: 3, windowSeconds: 300 },
      { supabase }
    );
    expect(fourth).toEqual({ limited: true, count: 4 });
  });

  it("tracks each key independently, so one caller's bursts don't affect another", async () => {
    const supabase = createTestSupabaseClient();
    const keyA = `test:${randomUUID()}`;
    const keyB = `test:${randomUUID()}`;

    for (let i = 0; i < 5; i++) {
      await checkRateLimit({ key: keyA, limit: 3, windowSeconds: 300 }, { supabase });
    }
    const resultB = await checkRateLimit(
      { key: keyB, limit: 3, windowSeconds: 300 },
      { supabase }
    );

    expect(resultB).toEqual({ limited: false, count: 1 });
  });

  it("resets the count once the window elapses", async () => {
    const supabase = createTestSupabaseClient();
    const key = `test:${randomUUID()}`;

    const first = await checkRateLimit({ key, limit: 3, windowSeconds: 1 }, { supabase });
    expect(first).toEqual({ limited: false, count: 1 });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const afterWindow = await checkRateLimit(
      { key, limit: 3, windowSeconds: 1 },
      { supabase }
    );
    expect(afterWindow).toEqual({ limited: false, count: 1 });
  });
});
