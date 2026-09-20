import { test, expect } from "@playwright/test";

import { CONTACT } from "../data/site";

test.describe("contact — custom build form", () => {
  /**
   * The registered legal entity must be visible on every instance of the form — general enquiry
   * (no `path`), Option A (design), and Option B (idea) — since all three render the same
   * `CustomBuildForm` component. Added 2026-08-13 at the user's explicit request.
   */
  for (const path of [undefined, "design", "idea"]) {
    test(`legal name is visible below submit (path=${path ?? "general"})`, async ({
      page,
    }) => {
      await page.goto(path ? `/contact?path=${path}` : "/contact");
      await expect(page.locator(".custom-form__legal")).toHaveText(
        `${CONTACT.legalName} · ${CONTACT.address}`,
      );
    });
  }

  test("blocks submit and shows inline errors when empty", async ({ page }) => {
    await page.goto("/contact?path=design");
    await page.locator("button.custom-form__submit").click();
    // Client-side zod validation surfaces field errors; no navigation / success.
    await expect(page.locator(".field__error").first()).toBeVisible();
    const errorCount = await page.locator(".field__error").count();
    expect(errorCount).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".custom-form__done")).toHaveCount(0);
  });

  test("valid submission reaches success state", async ({ page }) => {
    // Option B (idea) — a file is optional, so text fields alone reach success.
    await page.goto("/contact?path=idea");
    await page.locator("#name").fill("Vasu Agrawal");
    await page.locator("#email").fill("vasu@example.com");
    await page
      .locator("#message")
      .fill(
        "Need a 7-inch cinelifter airframe for a 1.5kg payload, six week timeline.",
      );
    await page.locator("button.custom-form__submit").click();
    await expect(page.locator(".custom-form__done")).toBeVisible();
    await expect(page.getByText(/we’ve got your brief/i)).toBeVisible();
    // The success message also names the legal entity on whose behalf we're replying.
    await expect(page.locator(".custom-form__done-note")).toContainText(
      CONTACT.legalName,
    );
  });

  test("design path requires a file to submit", async ({ page }) => {
    // Option A (design) — all text valid but no file → blocked with a file error, no success.
    await page.goto("/contact?path=design");
    await page.locator("#name").fill("Vasu Agrawal");
    await page.locator("#email").fill("vasu@example.com");
    await page
      .locator("#message")
      .fill(
        "CAD ready — 10-inch long-range frame, files attached, need a build plan.",
      );
    await page.locator("button.custom-form__submit").click();
    await expect(page.getByText(/attach your design file/i)).toBeVisible();
    await expect(page.locator(".custom-form__done")).toHaveCount(0);
  });

  test("path fork drives the copy", async ({ page }) => {
    await page.goto("/contact?path=idea");
    await expect(
      page.getByRole("heading", { name: /engineer your idea/i }),
    ).toBeVisible();
  });
});
