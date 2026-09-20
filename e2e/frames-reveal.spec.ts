import { test, expect } from "@playwright/test";

/**
 * Guards the desktop frames-dossier reveal:
 *  - the spec callouts are SCROLL-DRIVEN (hidden until the frame scrubs in, not baked static into
 *    the photo), and
 *  - every callout for a frame reveals TOGETHER, not one-at-a-time.
 * Regression for the "spec lines look static / specs appear one at a time" report.
 * Desktop-only: on mobile the panel is intentionally unpinned + static (see frames-mobile.spec).
 */
test.describe("frames dossier reveal (desktop)", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop pinned-reveal check");

  test("all spec callouts are scroll-driven and reveal together", async ({
    page,
  }) => {
    await page.goto("/");
    const panel = page.locator("#five-inch");
    await expect(panel).toHaveAttribute("data-animated", "true");

    const panelTop = await panel.evaluate(
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );

    const read = () =>
      page.evaluate(() => {
        const p = document.querySelector("#five-inch")!;
        const lines = [...p.querySelectorAll(".dossier__line")];
        const labels = [...p.querySelectorAll(".dossier__label")];
        return {
          count: lines.length,
          maxOffset: Math.max(
            ...lines.map((l) =>
              parseFloat(getComputedStyle(l).strokeDashoffset),
            ),
          ),
          // Line opacity is what hides them cross-browser — WebKit ignores stroke-dashoffset on
          // these lines, so the opacity gate is the real regression guard for Safari.
          maxLineOpacity: Math.max(
            ...lines.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
          minLineOpacity: Math.min(
            ...lines.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
          minLabelOpacity: Math.min(
            ...labels.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
        };
      });

    // At the pin start every callout is still hidden → the reveal is scroll-driven, not baked in.
    await page.evaluate((y) => window.scrollTo(0, y), panelTop);
    await page.waitForTimeout(500);
    const atStart = await read();
    expect(atStart.count).toBeGreaterThan(1);
    expect(atStart.maxOffset).toBeGreaterThan(0.9); // all lines undrawn
    expect(atStart.maxLineOpacity).toBeLessThan(0.1); // all lines invisible (Safari-safe)

    // A short scroll into the pin reveals ALL callouts together (no per-callout stagger): every
    // line fully drawn and every label visible at the same scroll depth.
    await page.evaluate(
      (y) => window.scrollTo(0, y + window.innerHeight * 0.7),
      panelTop,
    );
    await page.waitForTimeout(700);
    const revealed = await read();
    expect(revealed.maxOffset).toBeLessThan(0.05); // all lines fully drawn
    expect(revealed.minLineOpacity).toBeGreaterThan(0.9); // all lines visible
    expect(revealed.minLabelOpacity).toBeGreaterThan(0.9); // all labels visible
  });
});

/**
 * Reduced-motion path: the pinned scrub is skipped, but callouts must STILL be hidden until the
 * frame scrolls into view (a gentle one-shot reveal) — not baked into the photo from the start.
 * Regression for "the lines are already showing before scrolling" (seen with Reduce Motion on).
 */
test.describe("frames dossier reveal — reduced motion (desktop)", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop dossier layout only");

  test("callouts stay hidden until the frame enters, then reveal", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const panel = page.locator("#five-inch");
    // Reduced motion → static (unpinned) branch.
    await expect(panel).toHaveAttribute("data-animated", "false");

    const read = () =>
      page.evaluate(() => {
        const p = document.querySelector("#five-inch")!;
        const lines = [...p.querySelectorAll(".dossier__line")];
        const labels = [...p.querySelectorAll(".dossier__label")];
        return {
          maxLineOpacity: Math.max(
            ...lines.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
          minLineOpacity: Math.min(
            ...lines.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
          minLabelOpacity: Math.min(
            ...labels.map((l) => parseFloat(getComputedStyle(l).opacity)),
          ),
        };
      });

    // At the top of the page the frame is below the fold → callouts must NOT be pre-shown.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    expect((await read()).maxLineOpacity).toBeLessThan(0.1);

    // Scrolling the frame into view plays the one-shot reveal: lines + labels visible.
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const after = await read();
    expect(after.minLineOpacity).toBeGreaterThan(0.9);
    expect(after.minLabelOpacity).toBeGreaterThan(0.9);
  });
});
