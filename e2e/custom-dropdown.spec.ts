import { test, expect } from "@playwright/test";

test.describe("Custom navigation dropdown — Desktop", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop dropdown tests are only for desktop viewport");
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("dronesz_custom_nav_config");
      window.dispatchEvent(new CustomEvent("dronesz_custom_nav_updated"));
    });
  });

  test("hover over Custom opens dropdown and mouse travel keeps it open", async ({ page }) => {
    const customTrigger = page.locator(".nav__links .nav__custom-trigger");
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

  test("Frames Talk to us button navigates to /frames page", async ({ page }) => {
    const customTrigger = page.locator(".nav__links .nav__custom-trigger");
    await customTrigger.hover();

    const framesRow = page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Frames" });
    await expect(framesRow).toBeVisible();

    const framesTalkBtn = framesRow.locator(".nav__custom-talk-btn");
    await expect(framesTalkBtn).toBeVisible();
    await framesTalkBtn.click();

    // Check that we navigate to /frames
    await expect(page).toHaveURL(/\/frames/);
    const customTitle = page.locator("#custom-title");
    await expect(customTitle).toBeVisible();
  });

  test("Frames, Motors, and Parachute labels exist with Talk to us buttons", async ({ page }) => {
    const customTrigger = page.locator(".nav__links .nav__custom-trigger");
    await customTrigger.hover();

    // Verify Frames, Motors, and Parachute text labels exist
    const framesLabel = page.locator(".nav__custom-dropdown .nav__custom-label", { hasText: "Frames" });
    const motorsLabel = page.locator(".nav__custom-dropdown .nav__custom-label", { hasText: "Motors" });
    const parachuteLabel = page.locator(".nav__custom-dropdown .nav__custom-label", { hasText: "Parachute" });

    await expect(framesLabel).toBeVisible();
    await expect(motorsLabel).toBeVisible();
    await expect(parachuteLabel).toBeVisible();

    // Verify all 3 Talk to us buttons exist in desktop dropdown
    const talkButtons = page.locator(".nav__custom-dropdown .nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(3);
  });

  test("Talk to us buttons dynamically reflect updated URLs saved in admin settings", async ({ page }) => {
    // Set custom URLs in localStorage (same storage key used by Admin portal)
    await page.evaluate(() => {
      localStorage.setItem(
        "dronesz_custom_nav_config",
        JSON.stringify({
          framesTalkToUsUrl: "/frames",
          motorsTalkToUsUrl: "/contact?topic=motors-inquiry",
          parachuteTalkToUsUrl: "/contact?topic=parachute-inquiry",
        })
      );
      window.dispatchEvent(new CustomEvent("dronesz_custom_nav_updated"));
    });

    // Hover Custom
    const customTrigger = page.locator(".nav__links .nav__custom-trigger");
    await customTrigger.hover();

    const talkButtons = page.locator(".nav__custom-dropdown .nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(3);

    // Click Motors Talk to us
    await talkButtons.nth(1).click();
    await expect(page).toHaveURL(/topic=motors-inquiry/);
  });
});

test.describe("Custom navigation dropdown — Mobile", () => {
  test("Mobile drawer toggles and reveals Custom sub-navigation", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile drawer tests are only for mobile viewport");
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("dronesz_custom_nav_config");
      window.dispatchEvent(new CustomEvent("dronesz_custom_nav_updated"));
    });

    const mobileToggle = page.locator(".nav__mobile-toggle");
    await expect(mobileToggle).toBeVisible();
    await mobileToggle.click();

    const mobileDrawer = page.locator(".nav__mobile-drawer");
    await expect(mobileDrawer).toBeVisible();

    // Click Custom in mobile menu to expand accordion
    const mobileCustomBtn = mobileDrawer.getByRole("button", { name: /Custom/i });
    await mobileCustomBtn.click();

    const framesRow = mobileDrawer.locator(".nav__mobile-custom-row", { hasText: "Frames" });
    await expect(framesRow).toBeVisible();

    const talkButtons = mobileDrawer.locator(".nav__custom-talk-btn");
    await expect(talkButtons).toHaveCount(3);

    // Click frames Talk to us to ensure it navigates to /frames
    await talkButtons.nth(0).click();
    await expect(page).toHaveURL(/\/frames/);
    const customTitle = page.locator("#custom-title");
    await expect(customTitle).toBeVisible();
  });
});
