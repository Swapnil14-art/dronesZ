import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  validateAttachmentFile,
  validateAttachmentList,
  MAX_AGGREGATE_ATTACHMENT_BYTES,
} from "@/lib/model-formats";
import {
  createEnquiry,
  updateEnquiryDeliveryStatus,
  type AttachmentInput,
} from "@/lib/db";
import { sendEnquiryEmail, type AttachmentForDelivery } from "@/lib/resend-service";

function generateEnquiryReference(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DZ-ENQ-${yyyy}${mm}${dd}-${rand}`;
}

function fail(
  message: string,
  status: number,
  extra?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: extra }
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const limit = rateLimit(clientIp(request.headers), Date.now());
  if (!limit.ok) {
    return fail("Too many requests — please try again shortly.", 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Malformed form submission.", 400);
  }

  // Honeypot check
  const hp = form.get("_hp");
  if (typeof hp === "string" && hp.trim().length > 0) {
    return NextResponse.json({ success: true, message: "Accepted." });
  }

  const name = (form.get("name") as string | null)?.trim() || "";
  const email = (form.get("email") as string | null)?.trim() || "";
  const phone = (form.get("phone") as string | null)?.trim() || "";
  const path = (form.get("path") as string | null)?.trim() || "general";
  const message = (form.get("message") as string | null)?.trim() || "";
  const specificationsRaw = form.get("specifications") as string | null;

  if (!name || name.length < 2) {
    return fail("Please provide a valid name.", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return fail("Please provide a valid email address.", 400);
  }

  let specifications: Record<string, any> | undefined;
  if (specificationsRaw) {
    try {
      specifications = JSON.parse(specificationsRaw);
    } catch {
      // Ignored if not valid JSON
    }
  }

  // Process multiple attachments
  const incomingFiles: File[] = [];
  const filesAll = form.getAll("files");
  for (const item of filesAll) {
    if (item instanceof File && item.size > 0) {
      incomingFiles.push(item);
    }
  }

  // Also support single file key for backwards compatibility
  const singleFile = form.get("file");
  if (singleFile instanceof File && singleFile.size > 0) {
    if (!incomingFiles.some((f) => f.name === singleFile.name && f.size === singleFile.size)) {
      incomingFiles.push(singleFile);
    }
  }

  // Validate attachments
  for (const f of incomingFiles) {
    const check = validateAttachmentFile(f);
    if (!check.ok) {
      return fail(check.error || `File "${f.name}" failed validation.`, 400);
    }
  }

  const listCheck = validateAttachmentList(incomingFiles);
  if (!listCheck.ok) {
    return fail(listCheck.error || "Total attachments exceed allowed limit.", 400);
  }

  // If path is "design", at least one file is required
  if (path === "design" && incomingFiles.length === 0) {
    return fail("A CAD, STEP, or design specification file is required for this request.", 400);
  }

  // Prepare attachment buffers for persistence and delivery
  const attachmentsForDb: AttachmentInput[] = [];
  const attachmentsForDelivery: AttachmentForDelivery[] = [];

  for (const f of incomingFiles) {
    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    attachmentsForDb.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      fileSize: f.size,
      buffer,
    });
    attachmentsForDelivery.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      buffer,
      fileSize: f.size,
    });
  }

  const reference = generateEnquiryReference();
  let enquiryType = "contact_general";
  if (path === "design") enquiryType = "contact_design";
  else if (path === "idea") enquiryType = "contact_idea";
  else if (path === "build_your_own_drone" || path === "byod") enquiryType = "build_your_own_drone";

  let savedEnquiry;
  try {
    savedEnquiry = await createEnquiry(
      {
        reference,
        enquiryType,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        message,
        specifications,
        totalItems: 0,
      },
      attachmentsForDb
    );
  } catch (dbErr: any) {
    console.error("[POST /api/custom-build] Database persistence failed:", dbErr);
    return fail("Database error: Could not save your enquiry. Please try again.", 500);
  }

  // Attempt Resend Email Delivery
  const deliveryResult = await sendEnquiryEmail(savedEnquiry, attachmentsForDelivery);

  if (deliveryResult.ok) {
    await updateEnquiryDeliveryStatus(savedEnquiry.id, "SENT", null);
    return NextResponse.json({
      success: true,
      reference,
      message: "Enquiry received and delivered successfully.",
      messageId: deliveryResult.messageId,
    });
  } else {
    await updateEnquiryDeliveryStatus(
      savedEnquiry.id,
      "FAILED",
      deliveryResult.error || "Email delivery failed."
    );

    return NextResponse.json(
      {
        success: false,
        enquirySaved: true,
        reference,
        error:
          deliveryResult.error ||
          "Your enquiry was safely stored in our database, but automated email dispatch failed.",
      },
      { status: 502 }
    );
  }
  } catch (globalErr: any) {
    console.error("[POST /api/custom-build] Global error:", globalErr);
    return NextResponse.json(
      {
        success: false,
        error: globalErr?.message || "Internal server error",
        stack: globalErr?.stack,
      },
      { status: 500 }
    );
  }
}
