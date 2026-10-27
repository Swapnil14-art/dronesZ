import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getEnquiryById, deleteEnquiry } from "@/lib/db";

export async function GET(
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

    return NextResponse.json({ success: true, enquiry });
  } catch (err: any) {
    console.error(`[GET /api/admin/enquiries/${id}] Error:`, err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load enquiry." }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await getEnquiryById(numId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Enquiry not found." }, { status: 404 });
    }

    const deleted = await deleteEnquiry(numId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Could not delete enquiry." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Enquiry #${existing.reference} and associated attachments have been permanently deleted.`,
    });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/enquiries/${id}] Error:`, err);
    return NextResponse.json({ success: false, error: err.message || "Failed to delete enquiry." }, { status: 500 });
  }
}
