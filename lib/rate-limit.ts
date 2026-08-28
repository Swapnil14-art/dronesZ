/**
 * Best-effort, in-memory sliding-window rate limiter for form-submission routes. Keyed by
 * client IP. This is per-instance state — serverless may run several instances, so it caps
 * abuse from a single origin without pretending to be a distributed limiter. Swap for a
 * durable store (KV/Redis) if stronger guarantees are ever needed.
 */

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const hits = new Map<string, Window>();

function maxPerWindow(): number {
  const parsed = Number(process.env.RATE_LIMIT_MAX);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets — surface as Retry-After when blocked. */
  retryAfter: number;
}

export function rateLimit(key: string, now: number): RateLimitResult {
  const existing = hits.get(key);

  if (!existing || now >= existing.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= maxPerWindow()) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  hits.set(key, { count: existing.count + 1, resetAt: existing.resetAt });
  return { ok: true, retryAfter: 0 };
}

/** Derive a client identifier from proxy headers, falling back to a shared bucket. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
