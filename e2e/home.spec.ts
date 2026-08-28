import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test("hero heading and nav render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    // Frames and Custom are in-page anchor buttons (Lenis scroll); Contact routes as a link.
    await expect(page.getByRole("button", { name: "Frames" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  /**
   * The in-page nav anchors must land on their section from ANOTHER route too, not just from home.
   * The cross-route path reloads with a hash, and the browser's native hash scroll runs before the
   * pinned ScrollTriggers exist — so the target still sits far above its final position. #frames-
   * section is near the top and landed only ~280px off (passing by luck), but #custom-airframes sits
   * below every pin and was missed by thousands. Nav re-scrolls through Lenis once layout settles.
   *
   * Landing target is the nav's own height, not 0: the bar is fixed, so a section parked at the
   * viewport top hides its first ~64-71px behind it. Asserted two-sided — `top <= 4` also passes on
   * a wild overshoot, which is exactly the failure the cross-route path is prone to.
   */
  for (const { label, id } of [
    { label: "Frames", id: "#frames-section" },
    { label: "Custom", id: "#custom-airframes" },
  ]) {
    test(`nav "${label}" lands on its section from another route`, async ({
      page,
    }) => {
      await page.goto("/contact");
      await page.getByRole("button", { name: label }).click();
      await page.waitForURL(new RegExp(id.replace("#", "#")));

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
            }, id),
          {
            message: `${label} never landed clear of the nav at ${id}`,
            timeout: 20_000,
          },
        )
        .toBeLessThanOrEqual(4);
    });
  }

  /**
   * What the "Custom" item is FOR: it is a shortcut to the process rail — the "how a build works"
   * explanation — not the tagline/path-card fork further down the same section. Reworked
   * 2026-08-13 at the user's request: landing on the fork skipped past the explanation, so the
   * anchor moved to `#custom-airframes` on `.custom-process` instead. The rail sits only ~24px
   * below its section's top, so an un-offset anchor would still bury it under the fixed bar.
   */
  test('nav "Custom" opens the process rail, not the tagline/path-card fork', async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Custom" }).click();

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
});
