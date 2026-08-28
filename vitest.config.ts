import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests target the framework-agnostic trust-boundary logic (validation, rate limiting,
 * the SSRF guard, email formatting) — pure functions with no DOM, so the default node
 * environment is right. The `@/` alias mirrors tsconfig so imports match app code.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "test/**/*.test.ts"],
  },
});
