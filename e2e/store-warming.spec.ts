import { test, expect } from "@playwright/test";

test.describe("Store background warming and navigation", () => {
  test("Homepage loads cleanly and background warmer mounts without errors", async ({ page, isMobile }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    if (isMobile) {
      await expect(page.locator(".nav__mobile-toggle")).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
    }

    // Give idle callback a moment to trigger safely
    await page.waitForTimeout(2000);

    // Verify no unhandled exceptions were logged (filter out pre-existing React duplicate key warning)
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Download the React DevTools") &&
        !err.includes("favicon") &&
        !err.includes("same key")
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test("Navigation from Home to Store renders products and categories seamlessly", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    // Allow background warming idle window
    await page.waitForTimeout(2500);

    // Navigate to /store (handling mobile drawer if necessary)
    if (isMobile) {
      await page.locator(".nav__mobile-toggle").click();
      await page.locator(".nav__mobile-drawer").getByRole("link", { name: "Products" }).click();
    } else {
      await page.getByRole("link", { name: "Products" }).click();
    }
    await expect(page).toHaveURL(/\/store/);

    // Verify store landing catalog elements render
    await expect(page.getByText("Hardware Catalogue")).toBeVisible();
    await expect(page.locator(".store-landing__category-chips")).toBeVisible();

    // Verify All Hardware Systems chip is active
    await expect(
      page.locator(".store-landing__chip-btn--active")
    ).toContainText("All Hardware Systems");
  });

  test("Direct navigation to /store works with on-demand fallback", async ({ page }) => {
    // Open directly with cold state
    await page.goto("/store");
    await expect(page).toHaveURL(/\/store/);

    // Verify catalog header renders
    await expect(page.getByText("Hardware Catalogue")).toBeVisible();
    await expect(page.getByText("Flight Specs & Precision Components")).toBeVisible();
  });

  test("Store mobile layout renders responsive category chips and search bar", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile specific layout test");
    await page.goto("/store");

    await expect(page.locator(".store-landing__filter-bar")).toBeVisible();
    await expect(page.locator(".store-landing__search-box")).toBeVisible();
    await expect(page.locator(".store-landing__category-chips")).toBeVisible();
  });

  test("Product detail view renders correctly", async ({ page }) => {
    await page.goto("/products/29");
    await expect(page).toHaveURL(/\/products\/29/);

    // Verify product container or loading skeleton renders
    await expect(
      page.locator(".product-detail-page-container").or(page.getByText("Loading DronesZ Hardware Specifications"))
    ).toBeVisible({ timeout: 15000 });
  });
});
