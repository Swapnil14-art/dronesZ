import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendCartEnquiryEmail, CartEnquiryDetails, CartEnquiryItem } from "@/lib/enquiry-email";

// In-memory duplicate submission store: key -> timestamp
const recentSubmissions = new Map<string, number>();

// Clean up duplicate store periodically
function cleanupRecentSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60_000) {
      recentSubmissions.delete(key);
    }
  }
}

function fail(message: string, status: number, headers?: Record<string, string>): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status, headers });
}

export async function POST(request: Request): Promise<NextResponse> {
  cleanupRecentSubmissions();

  // 1. Abuse Controls / Rate Limiting by IP
  const ip = clientIp(request.headers);
  const limit = rateLimit(`cart-enquiry:${ip}`, Date.now());
  if (!limit.ok) {
    return fail("Too many requests. Please wait a moment before trying again.", 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  // 2. Authentication Verification: Token must be present
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail("Authentication required. Please sign in to submit a hardware enquiry.", 401);
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return fail("Authentication required. Please sign in to submit a hardware enquiry.", 401);
  }

  // Parse optional payload (e.g. cart notes or honeypot)
  let notes = "";
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      // Honeypot check
      if (body._hp && String(body._hp).trim()) {
        return NextResponse.json({ success: true, reference: "DZ-ENQ-VERIFIED" });
      }
      if (typeof body.notes === "string") {
        notes = body.notes.trim().substring(0, 1000);
      }
    }
  } catch {
    // Non-JSON or empty body is acceptable; notes will remain blank
  }

  // 3. Server-side Trust Boundary: Verify User with Backend
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8070";
  let userProfile: { email: string; fullName: string; phone?: string };
  try {
    const profileRes = await fetch(`${backendBase}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileRes.ok) {
      return fail("Your session has expired or is invalid. Please sign in again.", 401);
    }

    userProfile = await profileRes.json();
  } catch (err: any) {
    return fail("Unable to verify user session with the authentication service.", 503);
  }

  if (!userProfile?.email) {
    return fail("Invalid user profile received.", 401);
  }

  // 4. Server-side Trust Boundary: Fetch Customer's Actual Cart from Backend
  let cartData: { items: any[]; totalAmount?: number; totalItems?: number };
  try {
    const cartRes = await fetch(`${backendBase}/api/user/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!cartRes.ok) {
      return fail("Unable to retrieve cart contents for enquiry submission.", 502);
    }

    cartData = await cartRes.json();
  } catch (err: any) {
    return fail("Failed to communicate with cart storage service.", 503);
  }

  if (!cartData || !Array.isArray(cartData.items) || cartData.items.length === 0) {
    return fail("Your cart is empty. Please add components to your cart before sending an enquiry.", 400);
  }

  // 5. Duplicate Submission Protection (same user + items within 30 seconds)
  const itemsSignature = cartData.items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join(",");
  const dedupeKey = `${userProfile.email.toLowerCase()}:${itemsSignature}`;
  const lastSubmit = recentSubmissions.get(dedupeKey);
  const now = Date.now();

  if (lastSubmit && now - lastSubmit < 30_000) {
    return fail(
      "A hardware enquiry for these components was already submitted recently. Please wait before re-submitting.",
      429
    );
  }

  // 6. Assemble Verified Cart Details
  const enquiryItems: CartEnquiryItem[] = cartData.items.map((item) => ({
    productId: item.productId,
    productName: item.productName || `Component #${item.productId}`,
    productType: item.productType || "Hardware Component",
    sku: item.sku || undefined,
    quantity: item.quantity || 1,
    price: typeof item.price === "number" ? item.price : 0,
    subtotal: typeof item.subtotal === "number" ? item.subtotal : (item.price || 0) * (item.quantity || 1),
    productImage: item.productImage || undefined,
  }));

  const totalItemCount = enquiryItems.reduce((acc, i) => acc + i.quantity, 0);
  const indicativeTotal = enquiryItems.reduce((acc, i) => acc + (i.subtotal || 0), 0);

  // Generate Reference Number
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const enquiryRef = `DZ-ENQ-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

  const hostHeader = request.headers.get("host") || "dronesz.in";
  const protocol = hostHeader.includes("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${hostHeader}`;

  const enquiryDetails: CartEnquiryDetails = {
    enquiryRef,
    customerName: userProfile.fullName || "Customer",
    customerEmail: userProfile.email,
    customerPhone: userProfile.phone || undefined,
    notes: notes || undefined,
    submittedAt: new Date().toISOString(),
    items: enquiryItems,
    totalItems: totalItemCount,
    indicativeTotal,
    siteUrl,
  };

  // 7. Dispatch Email
  const sendResult = await sendCartEnquiryEmail(enquiryDetails);

  if (!sendResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error:
          sendResult.error ||
          "Failed to dispatch enquiry email to DronesZ sales team. Please try again or contact us directly.",
      },
      { status: 503 }
    );
  }

  // Record submission in dedupe store
  recentSubmissions.set(dedupeKey, now);

  // Return success with tracking reference
  // Note: Customer's cart is deliberately KEPT UNCHANGED.
  return NextResponse.json({
    success: true,
    reference: enquiryRef,
    message: "Enquiry submitted successfully! Our technical engineering team will review your specifications and contact you shortly.",
  });
}
