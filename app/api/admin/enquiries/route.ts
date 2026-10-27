import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getEnquiries, getEnquiryStats } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = (searchParams.get("sort") as "newest" | "oldest") || "newest";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const [paginated, stats] = await Promise.all([
      getEnquiries({ type, status, search, sort, limit, offset }),
      getEnquiryStats(),
    ]);

    return NextResponse.json({
      success: true,
      enquiries: paginated.enquiries,
      total: paginated.total,
      limit: paginated.limit,
      offset: paginated.offset,
      stats,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/enquiries] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch enquiries." },
      { status: 500 }
    );
  }
}
