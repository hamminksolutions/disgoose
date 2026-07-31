import { test, expect } from "@playwright/test";
import { uniqueUser, registerAndConfirm, login, searchAndSelectFirstAlbum } from "./helpers";

test("a user can add an album and see it in their profile grid", async ({ page }) => {
  const user = uniqueUser();
  await registerAndConfirm(page, user);
  await login(page, user);

  await searchAndSelectFirstAlbum(page, "Radiohead");

  await page.getByRole("button", { name: "Save rating" }).click();
  await page.waitForURL("/");

  await expect(page.getByText("5.0")).toBeVisible();
});
