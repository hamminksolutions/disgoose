import { test, expect, type Browser } from "@playwright/test";
import {
  uniqueUser,
  registerAndConfirm,
  login,
  searchAndSelectFirstAlbum,
  type TestUser,
} from "./helpers";

const REVIEW_TEXT = "Only friends should be able to read this review";

async function newLoggedInPage(browser: Browser, user: TestUser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerAndConfirm(page, user);
  await login(page, user);
  return { context, page };
}

test("a stranger can't see a review, but an accepted friend can", async ({ browser }) => {
  const owner = uniqueUser();
  const friend = uniqueUser();

  const ownerSession = await newLoggedInPage(browser, owner);
  const friendSession = await newLoggedInPage(browser, friend);

  // Owner rates an album with a review.
  await searchAndSelectFirstAlbum(ownerSession.page, "Radiohead");
  await ownerSession.page.getByLabel("Review (optional)").fill(REVIEW_TEXT);
  await ownerSession.page.getByRole("button", { name: "Save rating" }).click();
  await ownerSession.page.waitForURL("/");

  // Stranger visits the owner's public profile and opens the rating — no review.
  await friendSession.page.goto(`/profile/${owner.username}`);
  await friendSession.page.getByRole("button", { name: /^View rating for/ }).click();
  await expect(friendSession.page.getByText(REVIEW_TEXT)).not.toBeVisible();
  await friendSession.page.keyboard.press("Escape");

  // Friend sends a request from the Social page (issue #45 moved the add-friend
  // form there from the home page); owner accepts it from their own home page.
  await friendSession.page.goto("/social");
  await friendSession.page.getByPlaceholder("Add a friend by username").fill(owner.username);
  await friendSession.page.getByRole("button", { name: "Send request" }).click();
  await expect(friendSession.page.getByText("Sent!")).toBeVisible();

  await ownerSession.page.goto("/");
  await ownerSession.page.getByRole("button", { name: "Friend requests" }).click();
  await ownerSession.page.getByText(friend.username).waitFor();
  await ownerSession.page.getByRole("button", { name: "Accept" }).click();
  // .click() only waits for the click event, not the async accept fetch it
  // triggers — wait for the request to actually disappear (post-success
  // local state update) before the other session checks the friendship.
  await ownerSession.page.getByText(friend.username).waitFor({ state: "hidden" });

  // Now an accepted friend, the review becomes visible on the same profile.
  await friendSession.page.goto(`/profile/${owner.username}`);
  await friendSession.page.getByRole("button", { name: /^View rating for/ }).click();
  await expect(friendSession.page.getByText(REVIEW_TEXT)).toBeVisible();

  await ownerSession.context.close();
  await friendSession.context.close();
});
