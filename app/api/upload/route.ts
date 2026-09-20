import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_FILE_BYTES } from "@/lib/model-formats";

/**
 * Issues a short-lived client-upload token so large custom-build files upload straight to Blob,
 * bypassing the ~4.5 MB serverless body cap. Storage is PUBLIC with a random suffix: the URL is
 * unguessable (not enumerable) so the team can open it directly from the notification email,
 * without a login step. Size + content-type are constrained in the token, re-enforced by Blob
 * regardless of what the client claims.
 */

// Only the mesh/CAD extensions and images we accept — mapped to the MIME types Blob checks.
// Kept broad but bounded; the route handler for the form does the authoritative field checks.
const ALLOWED_CONTENT_TYPES = [
  "model/stl",
  "application/vnd.ms-pki.stl",
  "application/octet-stream", // STL/OBJ/STEP frequently arrive as generic binary
  "application/sla",
  "text/plain", // some OBJ/PLY exporters
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_FILE_BYTES,
      }),
      // Nothing to persist on completion — the client returns the URL to the form, which sends
      // it on to the submission route. Kept as a no-op so handleUpload's contract is satisfied.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
