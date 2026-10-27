import { describe, it, expect } from "vitest";
import {
  classifyFile,
  validateFile,
  shouldAttach,
  formatBytes,
  fileExtension,
  validateAttachmentFile,
  validateAttachmentList,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_AGGREGATE_ATTACHMENT_BYTES,
  ATTACH_MAX_BYTES,
  MAX_FILE_BYTES,
} from "./model-formats";

/** Minimal File stand-in — validateFile only reads name, type, size. */
function fakeFile(name: string, type: string, size: number): File {
  return { name, type, size } as File;
}

describe("classifyFile", () => {
  it("classifies mesh extensions", () => {
    expect(classifyFile(fakeFile("part.stl", "", 10))).toBe("mesh");
    expect(classifyFile(fakeFile("part.OBJ", "", 10))).toBe("mesh"); // case-insensitive
  });
  it("classifies CAD extensions", () => {
    expect(classifyFile(fakeFile("assembly.step", "", 10))).toBe("cad");
    expect(classifyFile(fakeFile("assembly.stp", "", 10))).toBe("cad");
  });
  it("classifies images by MIME, not extension", () => {
    expect(classifyFile(fakeFile("photo", "image/png", 10))).toBe("image");
  });
  it("marks unknown types unsupported", () => {
    expect(classifyFile(fakeFile("notes.txt", "text/plain", 10))).toBe("unsupported");
  });
});

describe("validateFile", () => {
  it("accepts a supported file within the size cap", () => {
    const r = validateFile(fakeFile("part.stl", "", 1000));
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("mesh");
  });
  it("rejects unsupported types with a message", () => {
    const r = validateFile(fakeFile("virus.exe", "application/x-msdownload", 10));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unsupported/i);
  });
  it("rejects files over the max size", () => {
    const r = validateFile(fakeFile("huge.stl", "", MAX_FILE_BYTES + 1));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/too large/i);
  });
});

describe("validateAttachmentFile and validateAttachmentList", () => {
  it("validates permitted CAD and document formats", () => {
    const stl = fakeFile("drone_mount.stl", "application/octet-stream", 2048);
    const step = fakeFile("airframe.step", "application/octet-stream", 4096);
    const pdf = fakeFile("specs.pdf", "application/pdf", 1024);

    expect(validateAttachmentFile(stl).ok).toBe(true);
    expect(validateAttachmentFile(step).ok).toBe(true);
    expect(validateAttachmentFile(pdf).ok).toBe(true);

    const listResult = validateAttachmentList([stl, step, pdf]);
    expect(listResult.ok).toBe(true);
    expect(listResult.totalBytes).toBe(2048 + 4096 + 1024);
  });

  it("strictly rejects dangerous executables (.exe, .sh, .bat, etc.)", () => {
    const exe = fakeFile("payload.exe", "application/x-msdownload", 500);
    const sh = fakeFile("script.sh", "text/x-sh", 500);
    const bat = fakeFile("install.bat", "application/x-bat", 500);

    expect(validateAttachmentFile(exe).ok).toBe(false);
    expect(validateAttachmentFile(exe).error).toContain("Executable files (.exe) are not permitted");

    expect(validateAttachmentFile(sh).ok).toBe(false);
    expect(validateAttachmentFile(bat).ok).toBe(false);

    expect(validateAttachmentList([exe]).ok).toBe(false);
  });

  it("enforces single file size limit (15 MB)", () => {
    const oversizedFile = fakeFile("heavy_mesh.obj", "model/obj", MAX_ATTACHMENT_FILE_BYTES + 10);
    const result = validateAttachmentFile(oversizedFile);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("exceeds the 15 MB per-file limit");
  });

  it("enforces aggregate multi-attachment size limit (25 MB)", () => {
    const file1 = fakeFile("f1.step", "application/octet-stream", 14 * 1024 * 1024);
    const file2 = fakeFile("f2.step", "application/octet-stream", 12 * 1024 * 1024);

    expect(validateAttachmentFile(file1).ok).toBe(true);
    expect(validateAttachmentFile(file2).ok).toBe(true);

    // Sum is 26 MB, exceeding 25 MB aggregate limit
    const listResult = validateAttachmentList([file1, file2]);
    expect(listResult.ok).toBe(false);
    expect(listResult.error).toContain("Total attachment size");
    expect(listResult.error).toContain("exceeds the 25 MB limit");
  });
});

describe("shouldAttach", () => {
  it("attaches at or below the threshold", () => {
    expect(shouldAttach(ATTACH_MAX_BYTES)).toBe(true);
    expect(shouldAttach(0)).toBe(true);
  });
  it("routes to Blob above the threshold", () => {
    expect(shouldAttach(ATTACH_MAX_BYTES + 1)).toBe(false);
  });
});

describe("helpers", () => {
  it("fileExtension lowercases and handles no-dot", () => {
    expect(fileExtension("A.STL")).toBe("stl");
    expect(fileExtension("noext")).toBe("");
  });
  it("formatBytes scales units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
