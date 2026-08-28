import { describe, it, expect } from "vitest";
import {
  classifyFile,
  validateFile,
  shouldAttach,
  formatBytes,
  fileExtension,
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
