import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Runs against the local dev server (reused if already up on :3007, else started).
 * Two projects give real desktop vs. mobile viewports so the frames pin/unpin behaviour and the
 * contact form are both covered at the sizes that matter.
 *
 * Regression is asserted behaviourally (layout geometry, visibility, success states) rather than
 * with pixel snapshots — robust across machines and CI without committing OS-specific baselines.
 * Add `toHaveScreenshot()` later if a hosted CI with a fixed renderer is set up.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3007",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev -p 3007",
    url: "http://localhost:3007",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
