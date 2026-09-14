export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://shuomuvvemiesoxyabnp.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodW9tdXZ2ZW1pZXNveHlhYm5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkzMDI3MywiZXhwIjoyMTAzNTA2MjczfQ.nlosu1eL2R1f29pMQMeX1elS9nzz5DyInGWskLl-TcA";

interface ProductImageRecord {
  id: number;
  product_id: number;
  file_name: string | null;
  mime_type: string | null;
  image_data: string | null;
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ productId: string; imageId: string }> },
): Promise<Response> {
  const { productId, imageId } = await props.params;

  const parsedProductId = parseInt(productId, 10);
  const parsedImageId = parseInt(imageId, 10);

  if (Number.isNaN(parsedProductId) || Number.isNaN(parsedImageId)) {
    return new Response("Invalid product or image ID", { status: 400 });
  }

  try {
    const queryUrl = `${SUPABASE_URL}/rest/v1/product_images?id=eq.${parsedImageId}&product_id=eq.${parsedProductId}&select=id,product_id,file_name,mime_type,image_data&limit=1`;

    const response = await fetch(queryUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return new Response("Failed to fetch image from database", {
        status: response.status,
      });
    }

    const data: ProductImageRecord[] = await response.json();

    if (!data || data.length === 0) {
      return new Response("Image not found", { status: 404 });
    }

    const imageRecord = data[0];
    const rawData = imageRecord.image_data;

    if (!rawData) {
      return new Response("Image not found", { status: 404 });
    }

    // Supabase PostgREST returns BYTEA columns as hex strings (e.g., "\x89504e47...")
    let hexString = rawData;
    if (hexString.startsWith("\\x") || hexString.startsWith("0x")) {
      hexString = hexString.slice(2);
    }

    const buffer = Buffer.from(hexString, "hex");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": imageRecord.mime_type || "image/png",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${encodeURIComponent(imageRecord.file_name || "image.png")}"`,
      },
    });
  } catch (error) {
    console.error("Error serving product image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
