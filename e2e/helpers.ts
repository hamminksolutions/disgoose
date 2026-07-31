import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";

const MAILPIT_URL = "http://127.0.0.1:54324";

export type TestUser = {
  email: string;
  username: string;
  password: string;
};

export function uniqueUser(): TestUser {
  const id = randomUUID().slice(0, 8);
  return {
    email: `${randomUUID()}@example.test`,
    username: `e2e_${id}`,
    password: "correct-horse-battery-staple",
  };
}

/** Finds the Supabase confirmation/recovery link in the most recent email sent to `email`. */
async function getAuthLinkFromLatestEmail(email: string): Promise<string> {
  const search = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`
  );
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  if (messages.length === 0) {
    throw new Error(`No email found for ${email}`);
  }

  const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  const body = (await detail.json()) as { Text: string; HTML: string };
  const match = (body.Text + body.HTML).match(/https?:\/\/[^\s"<]+\/auth\/v1\/verify\?[^\s"<]+/);
  if (!match) {
    throw new Error(`No Supabase verify link found in email to ${email}`);
  }
  return match[0];
}

/** Registers a new account through the real UI, then clicks the real confirmation link from Mailpit. */
export async function registerAndConfirm(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Check your email").waitFor();

  const confirmationLink = await getAuthLinkFromLatestEmail(user.email);
  await page.goto(confirmationLink);
}

export async function login(page: Page, user: Pick<TestUser, "email" | "password">) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}

/**
 * Navigates to /rate, searches, and selects the first result. /rate's search
 * form uses a plain onSubmit handler (unlike login/register's action-prop
 * forms), so it only intercepts the click once React hydrates — waiting for
 * network idle first avoids a fast click falling through to a native GET
 * submit before hydration attaches the listener.
 */
export async function searchAndSelectFirstAlbum(page: Page, query: string) {
  await page.goto("/rate");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Search for an album…").fill(query);
  await page.getByRole("button", { name: "Search" }).click();

  const firstResult = page.locator("ul li button").first();
  await firstResult.waitFor();
  await firstResult.click();
}
