import { test, expect } from "@playwright/test";

test("public Rebel Mart navigation works", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Good to see you." })).toBeVisible();

  await page.getByRole("link", { name: /create an account/i }).click();
  await expect(page.getByRole("heading", { name: "Make shopping simpler." })).toBeVisible();
});
