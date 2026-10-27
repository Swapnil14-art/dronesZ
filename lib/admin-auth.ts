import { NextRequest } from "next/server";
import crypto from "node:crypto";

export interface AdminAuthResult {
  authorized: boolean;
  admin?: {
    id: number;
    email: string;
    role: string;
  };
  error?: string;
}

export async function verifyAdminRequest(request: Request | NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing or invalid Authorization header." };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { authorized: false, error: "Missing or invalid Authorization header." };
  }

  // 1. Direct HMAC-SHA256 verification using shared JWT_SECRET from drone-store-system/.env
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const [headerB64, payloadB64, sigB64] = parts;
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(`${headerB64}.${payloadB64}`)
          .digest("base64url");

        const sigBuf = Buffer.from(sigB64);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < nowSeconds) {
            return { authorized: false, error: "Admin session expired. Please sign in again." };
          }

          const role = String(payload.role || "").toUpperCase();
          if (role.includes("ADMIN")) {
            return {
              authorized: true,
              admin: {
                id: payload.id || 1,
                email: payload.sub || "admin@example.com",
                role: "ADMIN",
              },
            };
          }
        }
      }
    } catch {
      // Fall through to HTTP backend check if direct JWT parsing encounters unexpected format
    }
  }

  // 2. HTTP verification against backend auth service
  const isDev = process.env.NODE_ENV !== "production";
  const primaryBackend = isDev
    ? "http://127.0.0.1:8070"
    : (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8070");
  const secondaryBackend = isDev
    ? (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL)
    : "http://127.0.0.1:8070";

  const targets = [primaryBackend, secondaryBackend].filter(Boolean) as string[];

  for (const base of targets) {
    try {
      const cleanBase = base.replace(/\/+$/, "");
      const res = await fetch(`${cleanBase}/api/admin/me`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (res.ok) {
        const admin = await res.json();
        return { authorized: true, admin };
      }
    } catch {
      // Continue to next target
    }
  }

  return { authorized: false, error: "Admin token verification failed." };
}
