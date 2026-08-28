import { test, expect } from "@playwright/test";

import { CUSTOM_AIRFRAMES } from "../data/frames";

/**
 * Guards the frame-type tag row added 2026-08-13 to fill the gap between the two-path fork and
 * "GET IN TOUCH" (the home-page Contact teaser). Positional, not just existence — a tag row
 * rendered anywhere else on the page would still pass a plain "the tags exist" check, which is
 * not the bug this guards against (same lesson as the process-rail and specimen-size tests).
 */
test.describe("custom airframes — frame type tags", () => {
  test("renders the client's frame types, after the path cards", async ({
    page,
  }) => {
    await page.goto("/");

    const tags = page.locator(".custom-fork__types .type-tag");
    await tags.first().scrollIntoViewIfNeeded();
    await expect(tags).toHaveCount(CUSTOM_AIRFRAMES.frameTypes.length);

    // Data-driven — drifting the copy without the test noticing is not possible. Asserted
    // against the DOM text, not the uppercase the CSS paints (text-transform stays presentational).
    await expect(tags).toHaveText([...CUSTOM_AIRFRAMES.frameTypes]);
  });

  test("sits between the path cards and the Contact teaser", async ({
    page,
  }) => {
    await page.goto("/");

    const tags = page.locator(".custom-fork__types");
    await tags.scrollIntoViewIfNeeded();
    await expect(tags).toBeVisible();

    const pos = await page.evaluate(() => {
      const top = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + window.scrollY) };
      };
      return {
        paths: top(".custom-fork__paths"),
        types: top(".custom-fork__types"),
        contact: top(".contact-teaser"),
      };
    });

    expect(pos.paths, "path cards missing").not.toBeNull();
    expect(pos.types, "type tag row missing").not.toBeNull();
    expect(pos.contact, "contact teaser missing").not.toBeNull();

    // Order in the document flow: path cards → type tags → Contact teaser.
    expect(pos.types!.top).toBeGreaterThanOrEqual(pos.paths!.top);
    expect(pos.contact!.top).toBeGreaterThanOrEqual(pos.types!.top);
  });
});
