import { describe, it, expect } from "vitest";
import { subjectFor, bodyText, type LeadEmail } from "./email";

const base: LeadEmail = {
  name: "Vasu Agrawal",
  email: "vasu@example.com",
  phone: "+91 98273 44411",
  path: "design",
  message: "Need a 7-inch cinelifter.",
};

describe("subjectFor", () => {
  it("uses the human path label + name", () => {
    expect(subjectFor(base)).toBe("Custom build — Has a design — Vasu Agrawal");
  });
  it("falls back gracefully on an unknown path", () => {
    expect(subjectFor({ ...base, path: "weird" })).toContain("enquiry");
  });
});

describe("bodyText", () => {
  it("includes contact fields and the message", () => {
    const body = bodyText(base);
    expect(body).toContain("Name: Vasu Agrawal");
    expect(body).toContain("Email: vasu@example.com");
    expect(body).toContain("Phone: +91 98273 44411");
    expect(body).toContain("Need a 7-inch cinelifter.");
  });

  it("omits the phone line when absent", () => {
    const body = bodyText({ ...base, phone: undefined });
    expect(body).not.toContain("Phone:");
  });

  it("notes an attached file", () => {
    const body = bodyText({
      ...base,
      attachment: { filename: "part.stl", content: Buffer.from("x") },
    });
    expect(body).toContain("File: part.stl (attached)");
  });

  it("includes the Blob link + name for a large file", () => {
    const url = "https://abc.public.blob.vercel-storage.com/uploads/part-7fh.stl";
    const body = bodyText({ ...base, fileUrl: url, fileName: "part.stl" });
    expect(body).toContain("File: part.stl");
    expect(body).toContain(url);
  });

  it("says 'none provided' with no file", () => {
    expect(bodyText(base)).toContain("File: none provided");
  });
});
