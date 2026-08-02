import { test, expect } from "@playwright/test";
import { uniqueUser, registerAndConfirm, login } from "./helpers";

test("a new user can register, confirm their email, and log in", async ({ page }) => {
  const user = uniqueUser();

  await registerAndConfirm(page, user);
  await login(page, user);

  // exact: true — issue #40 added a "@handle · collecting since ..." line to
  // ProfileHeader, which also contains (but isn't equal to) the username.
  await expect(page.getByText(user.username, { exact: true })).toBeVisible();
});

test("logging in before confirming the email fails", async ({ page }) => {
  const user = uniqueUser();

  await page.goto("/register");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Check your email").waitFor();

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Incorrect email or password")).toBeVisible();
});
