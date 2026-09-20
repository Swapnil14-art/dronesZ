import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test("hero heading and nav render", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop nav check");
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();

    // Hover Custom to verify dropdown Frames button
    await page.getByRole("button", { name: "Custom" }).hover();
    await expect(page.getByRole("menuitem", { name: "Frames" })).toBeVisible();
  });

  /**
   * The in-page nav anchors must land on their section from ANOTHER route too, not just from home.
   */
  test('nav "Custom -> Frames" lands on custom-airframes section from another route', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop route landing check");
    await page.goto("/contact");
    await page.getByRole("button", { name: "Custom" }).hover();
    await page.getByRole("menuitem", { name: "Frames" }).click();
    await page.waitForURL(/#custom-airframes/);

    // Poll rather than assert once: the landing deliberately waits for load + fonts + 2 frames.
    await expect
      .poll(
        () =>
          page.evaluate((sel) => {
            const r = document.querySelector(sel)?.getBoundingClientRect();
            const nav = document
              .querySelector(".nav")
              ?.getBoundingClientRect();
            if (!r || !nav) return null;
            return Math.round(Math.abs(r.top - nav.height));
          }, "#custom-airframes"),
        {
          message: `Frames never landed clear of the nav at #custom-airframes`,
          timeout: 20_000,
        },
      )
      .toBeLessThanOrEqual(4);
  });

  /**
   * What the "Custom -> Frames" item is FOR: it is a shortcut to the process rail.
   */
  test('nav "Custom -> Frames" opens the process rail, not the tagline/path-card fork', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop rail scroll check");
    await page.goto("/");
    await page.getByRole("button", { name: "Custom" }).hover();
    await page.getByRole("menuitem", { name: "Frames" }).click();

    const rail = page.locator(".custom-process__rail");
    await expect(rail).toBeVisible();

    // Wait for the Lenis scroll to SETTLE before measuring anything. Polling the assertion itself
    // would pass on any transient frame the target swept through mid-flight — verified: with the
    // nav offset removed, a polled assertion still went green while the final resting position had
    // the rail behind the bar. Two equal readings 150ms apart means the animation is done.
    await expect
      .poll(
        async () => {
          const a = await page.evaluate(() => window.scrollY);
          await page.waitForTimeout(150);
          const b = await page.evaluate(() => window.scrollY);
          return a === b && b > 0;
        },
        { message: "scroll never settled", timeout: 20_000 },
      )
      .toBe(true);

    // Single measurement at rest — this is the landing the user actually sees. Diff against the
    // nav height (not a strict `>=`) mirrors the cross-route check above: an un-offset or
    // over-offset landing both fail it, an exact landing does not.
    const resting = await page.evaluate(() => {
      const r = document
        .querySelector(".custom-process")
        ?.getBoundingClientRect();
      const nav = document.querySelector(".nav")?.getBoundingClientRect();
      if (!r || !nav) return null;
      return {
        clearsNavDiff: Math.round(Math.abs(r.top - nav.height)),
        inViewport: r.bottom > 0 && r.top < window.innerHeight,
      };
    });
    expect(resting?.inViewport).toBe(true);
    expect(resting?.clearsNavDiff).toBeLessThanOrEqual(4);

    // All four steps reachable without further scrolling — this is the point of landing here.
    await expect(page.locator(".process-step")).toHaveCount(4);
    for (const step of await page.locator(".process-step").all()) {
      await expect(step).toBeInViewport();
    }
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

