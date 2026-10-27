import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  getEnquiryById,
  getAllAttachmentsForEnquiry,
  updateEnquiryDeliveryStatus,
} from "@/lib/db";
import { sendEnquiryEmail } from "@/lib/resend-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ success: false, error: "Invalid enquiry ID." }, { status: 400 });
  }

  try {
    const enquiry = await getEnquiryById(numId);
    if (!enquiry) {
      return NextResponse.json({ success: false, error: "Enquiry not found." }, { status: 404 });
    }

    const attachments = await getAllAttachmentsForEnquiry(numId);
    const result = await sendEnquiryEmail(enquiry, attachments);

    if (result.ok) {
      await updateEnquiryDeliveryStatus(numId, "SENT", null);
      return NextResponse.json({
        success: true,
        message: `Email successfully delivered for enquiry #${enquiry.reference}.`,
        messageId: result.messageId,
      });
    } else {
      await updateEnquiryDeliveryStatus(numId, "FAILED", result.error || "Delivery retry failed.");
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Email delivery failed on retry.",
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error(`[POST /api/admin/enquiries/${id}/retry] Error:`, err);
    return NextResponse.json({ success: false, error: err.message || "Failed to retry email delivery." }, { status: 500 });
  }
}
