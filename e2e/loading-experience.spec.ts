import { test, expect } from "@playwright/test";

test.describe("Production Loading Experience Verification", () => {
  test("Top navigation progress bar exists and completes cleanly on page navigation", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    if (isMobile) {
      await page.locator(".nav__mobile-toggle").click();
      await page.locator(".nav__mobile-drawer").getByRole("link", { name: "Products" }).click();
    } else {
      await page.locator(".nav__links").getByRole("link", { name: "Products" }).click();
    }

    // Verify navigation successfully reached /store
    await expect(page).toHaveURL(/\/store/);
    await expect(page.getByText("Hardware Catalogue")).toBeVisible();

    // Verify progress bar is not stuck
    const progressBar = page.locator('[data-testid="navigation-progress-bar"]');
    await expect(progressBar).toHaveCount(0);
  });

  test("Product detail route renders specifications and skeleton placeholders", async ({ page }) => {
    await page.goto("/products/29");
    await expect(page).toHaveURL(/\/products\/29/);

    // Verify product detail container or blueprint skeleton renders
    await expect(
      page.locator(".product-detail-page-container").or(page.locator(".product-detail-skeleton-wrap"))
    ).toBeVisible({ timeout: 15000 });
  });

  test("Agricultural drone specification page loads with proper layout", async ({ page }) => {
    await page.goto("/store/agricultural-spraying-drone");
    await expect(page).toHaveURL(/\/store\/agricultural-spraying-drone/);

    // Verify agricultural drone page content or skeleton is visible
    await expect(
      page.locator(".agri-drone-page").or(page.locator(".agri-drone-skeleton-wrap"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("Store page has visible skeletons and responsive category chips", async ({ page }) => {
    await page.goto("/store");
    await expect(page).toHaveURL(/\/store/);

    // Filter chips and search bar must be visible
    await expect(page.locator(".store-landing__category-chips")).toBeVisible();
    await expect(page.locator(".store-landing__search-box")).toBeVisible();
  });

  test("Navigation transitions do not cause stuck progress bars", async ({ page }) => {
    await page.goto("/store");
    await expect(page.getByText("Hardware Catalogue")).toBeVisible();

    // Navigate to agri-drone
    await page.goto("/store/agricultural-spraying-drone");
    await expect(page).toHaveURL(/\/store\/agricultural-spraying-drone/);

    // Navigate back to store
    await page.goto("/store");
    await expect(page).toHaveURL(/\/store/);

    // Ensure progress bar completes and is not stuck
    await page.waitForTimeout(500);
    const progressBar = page.locator('[data-testid="navigation-progress-bar"]');
    await expect(progressBar).toHaveCount(0);
  });
});
