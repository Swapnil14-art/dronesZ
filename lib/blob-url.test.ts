import { describe, it, expect } from "vitest";
import { isBlobUrl } from "./blob-url";

describe("isBlobUrl (SSRF guard for emailed file links)", () => {
  it("accepts an https URL on a public Blob store host", () => {
    expect(
      isBlobUrl("https://abc123.public.blob.vercel-storage.com/uploads/x-7fh.stl"),
    ).toBe(true);
  });

  it("rejects a non-Blob host", () => {
    expect(isBlobUrl("https://evil.example.com/x.stl")).toBe(false);
  });

  it("rejects http (must be https)", () => {
    expect(
      isBlobUrl("http://abc.public.blob.vercel-storage.com/x.stl"),
    ).toBe(false);
  });

  it("rejects a look-alike host that only contains the suffix mid-string", () => {
    expect(
      isBlobUrl("https://public.blob.vercel-storage.com.evil.com/x.stl"),
    ).toBe(false);
  });

  it("rejects a subdomain-suffix spoof", () => {
    // endsWith(".public.blob.vercel-storage.com") — a bare host without the leading store
    // segment shouldn't pass, and neither should an attacker domain ending in the literal.
    expect(isBlobUrl("https://notpublic.blob.vercel-storage.com/x")).toBe(false);
  });

  it("rejects non-http protocols", () => {
    expect(isBlobUrl("javascript:alert(1)")).toBe(false);
    expect(isBlobUrl("data:text/html,<script>")).toBe(false);
    expect(isBlobUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects garbage / non-URL input", () => {
    expect(isBlobUrl("")).toBe(false);
    expect(isBlobUrl("not a url")).toBe(false);
    expect(isBlobUrl("///")).toBe(false);
  });
});
