/**
 * Validates that a client-supplied file link points at our own public Vercel Blob store — the
 * SSRF guard for the custom-build submission route. A large-file `fileUrl` is only ever placed
 * into the notification email (never fetched server-side), but we still refuse anything that
 * isn't an https URL on the Blob host so the team never receives an attacker-chosen link.
 */
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function isBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}
