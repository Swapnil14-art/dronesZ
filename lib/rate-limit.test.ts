import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";

// Each test uses a unique key so the module-level Map doesn't bleed across cases.
let n = 0;
const key = () => `test-${n++}-${Math.round(Math.random() * 1e9)}`;

describe("rateLimit", () => {
  const original = process.env.RATE_LIMIT_MAX;
  beforeEach(() => {
    process.env.RATE_LIMIT_MAX = "3";
  });
  afterEach(() => {
    process.env.RATE_LIMIT_MAX = original;
  });

  it("allows up to the max within a window, then blocks", () => {
    const k = key();
    const t = 1_000_000;
    expect(rateLimit(k, t).ok).toBe(true);
    expect(rateLimit(k, t + 1).ok).toBe(true);
    expect(rateLimit(k, t + 2).ok).toBe(true);
    const blocked = rateLimit(k, t + 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const k = key();
    const t = 2_000_000;
    rateLimit(k, t);
    rateLimit(k, t);
    rateLimit(k, t);
    expect(rateLimit(k, t).ok).toBe(false);
    // 15 min + 1 ms later → fresh window
    expect(rateLimit(k, t + 15 * 60 * 1000 + 1).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = key();
    const b = key();
    const t = 3_000_000;
    rateLimit(a, t);
    rateLimit(a, t);
    rateLimit(a, t);
    expect(rateLimit(a, t).ok).toBe(false);
    expect(rateLimit(b, t).ok).toBe(true); // b untouched
  });

  it("falls back to default max (5) when env is unset/invalid", () => {
    process.env.RATE_LIMIT_MAX = "not-a-number";
    const k = key();
    const t = 4_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit(k, t).ok).toBe(true);
    expect(rateLimit(k, t).ok).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientIp(h)).toBe("203.0.113.9");
  });
  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientIp(h)).toBe("198.51.100.7");
  });
  it("returns 'unknown' with no proxy headers", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
