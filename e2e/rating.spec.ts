import { test, expect } from "@playwright/test";
import { uniqueUser, registerAndConfirm, login, searchAndSelectFirstAlbum } from "./helpers";

test("a user can add an album and see it in their profile grid", async ({ page }) => {
  const user = uniqueUser();
  await registerAndConfirm(page, user);
  await login(page, user);

  await searchAndSelectFirstAlbum(page, "Radiohead");

  await page.getByRole("button", { name: "Save rating" }).click();
  await page.waitForURL("/");

  // Scoped to the grid cell — issue #40 added an "avg. rating" stat that
  // also reads "5.0" for a single rating, so a bare getByText is ambiguous.
  await expect(
    page.getByRole("button", { name: /^View rating for/ }).getByText("5.0")
  ).toBeVisible();
});

test("a user can type a score with the keyboard, including a comma decimal", async ({ page }) => {
  const user = uniqueUser();
  await registerAndConfirm(page, user);
  await login(page, user);

  await searchAndSelectFirstAlbum(page, "Radiohead");

  const scoreInput = page.getByRole("spinbutton");
  await scoreInput.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("9,2");
  await scoreInput.blur();
  await expect(scoreInput).toHaveValue("9.2");

  await page.getByRole("button", { name: "Save rating" }).click();
  await page.waitForURL("/");

  await expect(
    page.getByRole("button", { name: /^View rating for/ }).getByText("9.2")
  ).toBeVisible();
});
