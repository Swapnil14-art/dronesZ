import { NextResponse } from "next/server";
import { CustomBuildSchema } from "@/lib/form-schema";
import { ATTACH_MAX_BYTES, validateFile } from "@/lib/model-formats";
import { sendLeadEmail, type LeadAttachment } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isBlobUrl } from "@/lib/blob-url";

/**
 * Custom-build lead submission. Accepts multipart/form-data: the text fields, plus EITHER a
 * small file to attach directly (`file`) OR the metadata of a large file already uploaded to
 * Blob (`fileUrl` + `fileName`). Everything is re-validated at this trust boundary — never
 * trusting what the client sent — then a single notification email goes to the team. There is
 * no storage of record: the inbox (with attachment or Blob link) is the lead store.
 */

function fail(
  message: string,
  status: number,
  extra?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: extra },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
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
    return fail("Malformed submission.", 400);
  }

  // Honeypot: a hidden field only bots fill. Silently accept so we don't teach them the tell.
  if ((form.get("_hp") as string | null)?.trim()) {
    return NextResponse.json({ success: true });
  }

  const parsed = CustomBuildSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    path: form.get("path") ?? "general",
    message: form.get("message"),
    _hp: form.get("_hp") ?? "",
  });
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Please check the form.",
      400,
    );
  }
  const lead = parsed.data;

  // Resolve the file into either an attachment or a validated link — or nothing.
  let attachment: LeadAttachment | undefined;
  let fileUrl: string | undefined;
  let fileName: string | undefined;

  const file = form.get("file");
  const claimedUrl = (form.get("fileUrl") as string | null)?.trim();

  if (file instanceof File && file.size > 0) {
    const check = validateFile(file);
    if (!check.ok) return fail(check.error ?? "That file can’t be used.", 400);
    if (file.size > ATTACH_MAX_BYTES) {
      return fail(
        "Large files must be uploaded to storage, not attached.",
        400,
      );
    }
    attachment = {
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    };
  } else if (claimedUrl) {
    if (!isBlobUrl(claimedUrl)) return fail("Invalid file reference.", 400);
    fileUrl = claimedUrl;
    fileName = (form.get("fileName") as string | null)?.trim() || "upload";
  }

  // Option A ("I have a design") must include a file — mirrors the client-side guard so the
  // rule holds even if the form is bypassed.
  if (lead.path === "design" && !attachment && !fileUrl) {
    return fail("A design file is required for this request.", 400);
  }

  const result = await sendLeadEmail({
    name: lead.name,
    email: lead.email,
    phone: lead.phone || undefined,
    path: lead.path,
    message: lead.message,
    attachment,
    fileUrl,
    fileName,
  });

  if (!result.ok) {
    return fail(
      "We couldn’t send your enquiry. Please email us directly.",
      502,
    );
  }
  return NextResponse.json({ success: true });
}
