import { test, expect } from "@playwright/test";

/**
 * Guards the mobile frames-dossier fix: on phones the panel must NOT pin, and the spec labels
 * must sit below the specimen photo (not overlap it). Runs on the mobile project only.
 */
test.describe("frames dossier on mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile-only layout check");

  test("dossier is unpinned and labels stack below the photo", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#five-inch");
    await panel.scrollIntoViewIfNeeded();

    // Not pinned → the static resting state ran.
    await expect(panel).toHaveAttribute("data-animated", "false");

    const geom = await page.evaluate(() => {
      const p = document.querySelector("#five-inch")!;
      const photo = p.querySelector(".dossier__photo")!.getBoundingClientRect();
      const labels = p.querySelector(".dossier__labels")!.getBoundingClientRect();
      const header = p.querySelector(".dossier__header")!.getBoundingClientRect();
      const panelRect = p.getBoundingClientRect();
      return {
        labelsBelowPhoto: labels.top >= photo.bottom - 2,
        headerWithinPanel: header.bottom <= panelRect.bottom + 2,
        firstLabelVisible:
          getComputedStyle(p.querySelector(".dossier__label")!).opacity === "1",
      };
    });

    expect(geom.labelsBelowPhoto).toBe(true);
    expect(geom.headerWithinPanel).toBe(true);
    expect(geom.firstLabelVisible).toBe(true);
  });
});
