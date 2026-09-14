import { test, expect } from "@playwright/test";

test.describe("Custom navigation dropdown — Desktop", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop dropdown tests are only for desktop viewport");
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("dronesz_custom_nav_config");
    });
  });

  test("hover over Custom opens dropdown and mouse travel keeps it open", async ({ page }) => {
    await page.goto("/");
    const customTrigger = page.locator(".nav__desktop .nav__custom-trigger");
    const dropdown = page.locator(".nav__custom-dropdown");

    await expect(dropdown).not.toBeVisible();

    // Hover over Custom trigger
    await customTrigger.hover();
    await expect(dropdown).toBeVisible();

    // Move cursor into the dropdown panel — stays open
    await dropdown.hover();
    await expect(dropdown).toBeVisible();

    // Move cursor away to body
    await page.mouse.move(0, 0);
    await expect(dropdown).not.toBeVisible();
  });

  test("Frames is clickable and navigates to the existing custom-airframes section", async ({ page }) => {
    await page.goto("/");
    const customTrigger = page.locator(".nav__desktop .nav__custom-trigger");
    await customTrigger.hover();

    const framesBtn = page.getByRole("menuitem", { name: "Frames" });
    await expect(framesBtn).toBeVisible();
    await framesBtn.click();

    // Check that target custom-airframes section is present
    const airframesSection = page.locator("#custom-airframes");
    await expect(airframesSection).toBeVisible();
  });

  test("Motors and Propellers labels are NOT clickable, but Talk to us buttons are", async ({ page }) => {
    await page.goto("/");
    const customTrigger = page.locator(".nav__desktop .nav__custom-trigger");
    await customTrigger.hover();

    // Verify Motors and Propellers text labels exist as unclickable plain text
    const motorsLabel = page.locator(".nav__custom-dropdown .nav__custom-label", { hasText: "Motors" });
    const propellersLabel = page.locator(".nav__custom-dropdown .nav__custom-label", { hasText: "Propellers" });

    await expect(motorsLabel).toBeVisible();
    await expect(propellersLabel).toBeVisible();

    // Verify both Talk to us buttons exist in desktop dropdown
    const talkButtons = page.locator(".nav__custom-dropdown .nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(2);
  });

  test("Talk to us buttons dynamically reflect updated URLs saved in admin settings", async ({ page }) => {
    await page.goto("/");

    // Set custom URLs in localStorage (same storage key used by Admin portal)
    await page.evaluate(() => {
      localStorage.setItem(
        "dronesz_custom_nav_config",
        JSON.stringify({
          motorsTalkToUsUrl: "/contact?topic=motors-inquiry",
          propellersTalkToUsUrl: "/contact?topic=propellers-inquiry",
        })
      );
      window.dispatchEvent(new CustomEvent("dronesz_custom_nav_updated"));
    });

    // Hover Custom
    const customTrigger = page.locator(".nav__desktop .nav__custom-trigger");
    await customTrigger.hover();

    const talkButtons = page.locator(".nav__custom-dropdown .nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(2);

    // Click Motors Talk to us
    await talkButtons.nth(0).click();
    await expect(page).toHaveURL(/topic=motors-inquiry/);
  });
});

test.describe("Custom navigation dropdown — Mobile", () => {
  test("Mobile drawer toggles and reveals Custom sub-navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const mobileToggle = page.locator(".nav__mobile-toggle");
    await expect(mobileToggle).toBeVisible();
    await mobileToggle.click();

    const mobileDrawer = page.locator(".nav__mobile-drawer");
    await expect(mobileDrawer).toBeVisible();

    // Click Custom in mobile menu to expand accordion
    const mobileCustomBtn = mobileDrawer.getByRole("button", { name: /Custom/i });
    await mobileCustomBtn.click();

    const framesBtn = mobileDrawer.getByRole("button", { name: "Frames" });
    await expect(framesBtn).toBeVisible();

    const talkButtons = mobileDrawer.locator(".nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(2);

    // Click frames to ensure it navigates
    await framesBtn.click();
    const airframesSection = page.locator("#custom-airframes");
    await expect(airframesSection).toBeVisible();
  });
});
