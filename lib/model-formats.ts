/**
 * Single source of truth for which files the custom-build uploader accepts and how each is
 * previewed. Shared by the dropzone (accept list + validation), the viewer (preview routing),
 * and later the upload route (server-side re-validation), so the trust boundary is defined
 * in exactly one place.
 *
 * online-3d-viewer renders STL/OBJ/PLY/glTF entirely from its own bundle (three.js). Its CAD
 * loaders (STEP via occt-import-js) are hardcoded to a third-party CDN in v0.18, so we do NOT
 * preview STEP in-browser — those files still upload and reach the team, just without a live
 * 3D preview. See .claude/sessions notes for the decision.
 */

export type PreviewKind = "mesh" | "cad" | "image" | "unsupported";

/** Extensions o3dv renders offline from its bundled loaders. */
const MESH_EXTS = ["stl", "obj", "ply", "gltf", "glb", "3ds"] as const;
/** CAD formats we accept + forward but deliberately don't preview client-side. */
const CAD_EXTS = ["step", "stp"] as const;

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB — comfortably covers dense STL/STEP.
export const MAX_FILE_MB = Math.round(MAX_FILE_BYTES / 1024 / 1024);

/**
 * Files at or below this size are POSTed straight to the submission route and attached to the
 * notification email; larger files are client-uploaded to Blob first and emailed as a link.
 * Kept under Vercel's ~4.5 MB serverless request-body cap so the direct-attach POST never
 * exceeds it (multipart overhead + text fields included). Single source of truth for the
 * split, shared by the form (which branch to take) and the route (which branch to expect).
 */
export const ATTACH_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/** True when a file is small enough to attach directly rather than route through Blob. */
export function shouldAttach(size: number): boolean {
  return size <= ATTACH_MAX_BYTES;
}

/** `accept` attribute for <input type="file"> — extensions + any image MIME. */
export const ACCEPT_ATTR = [
  ...MESH_EXTS.map((e) => `.${e}`),
  ...CAD_EXTS.map((e) => `.${e}`),
  "image/*",
].join(",");

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function classifyFile(file: File): PreviewKind {
  if (file.type.startsWith("image/")) return "image";
  const ext = fileExtension(file.name);
  if ((MESH_EXTS as readonly string[]).includes(ext)) return "mesh";
  if ((CAD_EXTS as readonly string[]).includes(ext)) return "cad";
  return "unsupported";
}

export interface FileValidation {
  ok: boolean;
  kind: PreviewKind;
  error?: string;
}

export function validateFile(file: File): FileValidation {
  const kind = classifyFile(file);
  if (kind === "unsupported") {
    return {
      ok: false,
      kind,
      error: "Unsupported file. Upload STL, OBJ, STEP, or an image.",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      kind,
      error: `File is too large (max ${MAX_FILE_MB} MB).`,
    };
  }
  return { ok: true, kind };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}
