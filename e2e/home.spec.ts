import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test("hero heading and nav render", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop nav check");
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();

    // Hover Custom to verify dropdown items
    await page.getByRole("button", { name: "Custom" }).hover();
    await expect(page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Frames" })).toBeVisible();
    await expect(page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Motors" })).toBeVisible();
    await expect(page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Parachute" })).toBeVisible();
  });

  /**
   * Nav "Custom -> Frames Talk to us" lands on /frames page.
   */
  test('nav "Custom -> Frames" lands on /frames from another route', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop route landing check");
    await page.goto("/contact");
    await page.getByRole("button", { name: "Custom" }).hover();
    const framesRow = page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Frames" });
    await framesRow.locator(".nav__custom-talk-btn").click();
    await expect(page).toHaveURL(/\/frames/);
    await expect(page.locator("#custom-title")).toBeVisible();
  });

  /**
   * Nav "Custom -> Frames Talk to us" opens the /frames page with process rail.
   */
  test('nav "Custom -> Frames" opens the /frames page with process rail', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop rail scroll check");
    await page.goto("/");
    await page.getByRole("button", { name: "Custom" }).hover();
    const framesRow = page.locator(".nav__custom-dropdown .nav__custom-row", { hasText: "Frames" });
    await framesRow.locator(".nav__custom-talk-btn").click();

    await expect(page).toHaveURL(/\/frames/);
    const rail = page.locator(".custom-process__rail");
    await expect(rail).toBeVisible();

    // All four steps rendered
    await expect(page.locator(".process-step")).toHaveCount(4);
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("MissionSpecSection renders in correct order with all 5 specs and dark mode support", async ({
    page,
  }) => {
    await page.goto("/");

    // Check heading and badge
    await expect(page.getByText("Engineered in India")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Build\.\s*Fly\.\s*Beyond\./i }),
    ).toBeVisible();
    await expect(page.getByText("DRONESZ / SYSTEM SPEC")).toBeVisible();

    // Check all 5 specs
    const specTitles = [
      "Secured supply chain",
      "Less lead time",
      "Manufacturing in India",
      "Low MOQ, customisation available",
      "Built for every mission",
    ];
    for (const title of specTitles) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }

    // Verify DOM order: Process -> MissionSpecSection -> CustomAirframes
    const order = await page.evaluate(() => {
      const mainChildren = Array.from(
        document.querySelector("main")?.children || [],
      );
      const processIndex = mainChildren.findIndex(
        (el) =>
          el.classList.contains("manufacturing-process") ||
          el.querySelector(".manufacturing-process") !== null,
      );
      const specIndex = mainChildren.findIndex((el) =>
        el.textContent?.includes("DRONESZ / SYSTEM SPEC"),
      );
      const customAirframesIndex = mainChildren.findIndex(
        (el) =>
          el.id === "custom-airframes" ||
          el.querySelector("#custom-airframes") !== null,
      );
      return { processIndex, specIndex, customAirframesIndex };
    });

    expect(order.processIndex).toBeLessThan(order.specIndex);
    expect(order.specIndex).toBeLessThan(order.customAirframesIndex);

    // Verify dark mode class toggle works
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await expect(page.getByText("DRONESZ / SYSTEM SPEC")).toBeVisible();
  });
});

