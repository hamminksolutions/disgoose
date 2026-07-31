import { test, expect } from "@playwright/test";
import { uniqueUser, registerAndConfirm, login } from "./helpers";

test("a logged-in user can delete their account from the app, then can't log back in", async ({
  page,
}) => {
  const user = uniqueUser();
  await registerAndConfirm(page, user);
  await login(page, user);

  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByText("This permanently deletes your account").waitFor();
  await page.getByRole("button", { name: "Yes, delete my account" }).click();

  await page.waitForURL("/login");

  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Incorrect email or password")).toBeVisible();
});
