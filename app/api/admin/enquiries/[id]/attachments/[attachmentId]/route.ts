import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getEnquiryAttachmentData } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
): Promise<Response> {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;
  const enquiryId = parseInt(id, 10);
  const attId = parseInt(attachmentId, 10);

  if (isNaN(enquiryId) || isNaN(attId)) {
    return NextResponse.json({ success: false, error: "Invalid enquiry or attachment ID." }, { status: 400 });
  }

  try {
    const attachment = await getEnquiryAttachmentData(enquiryId, attId);
    if (!attachment) {
      return NextResponse.json({ success: false, error: "Attachment not found." }, { status: 404 });
    }

    const safeFilename = encodeURIComponent(attachment.filename);

    return new Response(new Uint8Array(attachment.buffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        "Content-Length": String(attachment.buffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error(`[GET /api/admin/enquiries/${id}/attachments/${attachmentId}] Error:`, err);
    return NextResponse.json({ success: false, error: err.message || "Failed to download attachment." }, { status: 500 });
  }
}
