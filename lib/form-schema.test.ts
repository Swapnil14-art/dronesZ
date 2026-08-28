import { describe, it, expect } from "vitest";
import { CustomBuildSchema } from "./form-schema";

const valid = {
  name: "Vasu Agrawal",
  email: "vasu@example.com",
  phone: "+91 98273 44411",
  path: "design" as const,
  message: "Need a 7-inch cinelifter for a 1.5kg payload, six week timeline.",
  _hp: "",
};

describe("CustomBuildSchema", () => {
  it("accepts a valid submission", () => {
    expect(CustomBuildSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults path to general when omitted", () => {
    const { path, ...rest } = valid;
    const r = CustomBuildSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBe("general");
  });

  it("rejects an invalid path enum", () => {
    expect(CustomBuildSchema.safeParse({ ...valid, path: "hacker" }).success).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(CustomBuildSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("rejects a too-short name and message", () => {
    expect(CustomBuildSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(CustomBuildSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
  });

  it("treats phone as optional (empty string allowed)", () => {
    expect(CustomBuildSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });

  it("rejects a filled honeypot", () => {
    expect(CustomBuildSchema.safeParse({ ...valid, _hp: "i am a bot" }).success).toBe(false);
  });

  it("trims and enforces max lengths", () => {
    const longMsg = "x".repeat(2001);
    expect(CustomBuildSchema.safeParse({ ...valid, message: longMsg }).success).toBe(false);
  });
});
