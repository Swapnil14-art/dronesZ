import { test, expect } from "@playwright/test";

import { CUSTOM_AIRFRAMES } from "../data/frames";

/**
 * Guards the process rail that fills the band above "Your Mission. Our Engineering.".
 *
 * That band used to be ~400px of blank canvas: the pinned reveal centres a 424px plate inside
 * 100vh (leaving ~240px of quiet below it), and .custom-fork then stacked a full --space-section
 * on top of that before its tagline. The rail now occupies it.
 *
 * The load-bearing assertion is POSITIONAL — the rail must sit between the reveal's media plate
 * and the tagline. Asserting only that the steps exist would still pass if the rail were rendered
 * somewhere harmless (inside the fork, after the cards), which is the bug this guards against.
 */
test.describe("custom airframes — process rail", () => {
  test("renders the client's four steps, on one line each", async ({
    page,
  }) => {
    await page.goto("/");

    const rail = page.locator(".custom-process__rail");
    await rail.scrollIntoViewIfNeeded();
    await expect(rail).toBeVisible();

    // Ordered list semantics — it is a sequence, not a bag of cards.
    expect(await rail.evaluate((el) => el.tagName)).toBe("OL");

    const steps = page.locator(".process-step");
    await expect(steps).toHaveCount(CUSTOM_AIRFRAMES.process.length);

    // Labels come from the data layer, so drifting the copy without the test noticing is not possible.
    // Asserted against the DOM text, not the uppercase the CSS paints — that is also what a screen
    // reader announces, and text-transform must stay presentational.
    await expect(page.locator(".process-step__label")).toHaveText([
      ...CUSTOM_AIRFRAMES.process,
    ]);
    await expect(page.locator(".process-step__num")).toHaveText([
      "01",
      "02",
      "03",
      "04",
    ]);

    // Uniform row height ⇒ no label wrapped to a second line. "MANUFACTURE" at uppercase tracking
    // is the one that overflows a narrow cell, and it wraps silently — nothing clips, the row just
    // grows. Comparing heights within a grid row catches it.
    const heights = await steps.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height)),
    );
    expect(new Set(heights).size, `step heights diverged: ${heights}`).toBe(1);
  });

  test("sits between the reveal plate and the tagline", async ({ page }) => {
    await page.goto("/");

    const rail = page.locator(".custom-process__rail");
    await rail.scrollIntoViewIfNeeded();
    await expect(rail).toBeVisible();

    const pos = await page.evaluate(() => {
      const top = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top + window.scrollY),
          bottom: Math.round(r.bottom + window.scrollY),
        };
      };
      return {
        media: top(".custom-reveal__media"),
        rail: top(".custom-process"),
        tagline: top(".custom-fork__tagline"),
      };
    });

    expect(pos.media, "reveal media plate missing").not.toBeNull();
    expect(pos.rail, "process band missing").not.toBeNull();
    expect(pos.tagline, "fork tagline missing").not.toBeNull();

    // Order in the document flow: plate → rail → tagline.
    expect(pos.rail!.top).toBeGreaterThanOrEqual(pos.media!.bottom);
    expect(pos.tagline!.top).toBeGreaterThanOrEqual(pos.rail!.bottom);

    // And the rail must actually FILL the band, not perch at one end of it. Before the fix the
    // plate-to-tagline run was ~400px of nothing; the rail should now cover most of what remains
    // between its own top and the tagline.
    const bandToTagline = pos.tagline!.top - pos.rail!.top;
    const railHeight = pos.rail!.bottom - pos.rail!.top;
    expect(railHeight / bandToTagline).toBeGreaterThan(0.6);
  });
});
