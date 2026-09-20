import { test, expect } from "@playwright/test";

import { FRAME_STORIES } from "../data/frames";

/**
 * Guards the uniform-specimen fix: every pre-built frame photo must PAINT at an identical width and
 * height on every breakpoint.
 *
 * Deliberately measures the painted area, not the element box. The element box was already uniform
 * on desktop while the painted photo was not — `object-fit: contain` letterboxed the narrower
 * flat-lays, so the 5" painted 323px wide inside a 492px box (169px of grey side bars) against the
 * 13"'s 492px. A bounding-box assertion passes straight through that bug. The flat-lays are now
 * pre-padded to one shared aspect (scripts/pad-frame-specimens.mjs), so painted == box and side bars
 * are 0 on all four.
 *
 * Runs on both projects — the mobile path (ratio on .dossier__plate) and the desktop path (ratio on
 * .dossier__specimen) are separate CSS rules and each needs covering.
 */
test.describe("frames dossier — uniform specimen size", () => {
  test("every frame photo paints at the same width and height", async ({
    page,
  }) => {
    await page.goto("/");

    const shots: Array<{ id: string; painted: string; bars: number }> = [];
    for (const story of FRAME_STORIES) {
      const photo = page.locator(`#${story.id} .dossier__photo`);
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toBeVisible();
      // next/image decodes lazily and the optimizer can be cold, so naturalWidth is 0 for a while.
      // Painted size is derived from naturalWidth — measuring early would compare zeros and pass
      // vacuously. Wait for a real decode first.
      await expect
        .poll(
          () =>
            photo.evaluate((el) => (el as HTMLImageElement).naturalWidth > 0),
          { message: `${story.id} image never decoded` },
        )
        .toBe(true);

      const m = await photo.evaluate((el) => {
        const img = el as HTMLImageElement;
        const r = img.getBoundingClientRect();
        // Painted area of a contain-fit image: the limiting axis fills, the other letterboxes.
        const natural = img.naturalWidth / img.naturalHeight;
        const box = r.width / r.height;
        const pw = natural < box ? r.height * natural : r.width;
        const ph = natural < box ? r.height : r.width / natural;
        return {
          pw: Math.round(pw),
          ph: Math.round(ph),
          bars: Math.round(r.width - pw),
          decoded: img.naturalWidth > 0,
        };
      });

      expect(m.decoded, `${story.id} image never decoded`).toBe(true);
      expect(m.pw).toBeGreaterThan(0);
      shots.push({
        id: story.id,
        painted: `${m.pw}x${m.ph}`,
        bars: m.bars,
      });
    }

    expect(shots).toHaveLength(FRAME_STORIES.length);

    // No letterbox bars anywhere (±1px for sub-pixel aspect rounding across the four files).
    for (const s of shots) {
      expect(s.bars, `${s.id} has letterbox bars`).toBeLessThanOrEqual(1);
    }

    // Every painted size must equal the first — labelled with ids so a failure names the odd one out.
    const target = shots[0].painted;
    expect(shots.map((s) => `${s.id}:${s.painted}`)).toEqual(
      shots.map((s) => `${s.id}:${target}`),
    );
  });
});
