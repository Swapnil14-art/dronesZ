import { describe, it, expect } from "vitest";
import { GET as getImageById } from "@/app/api/products/[productId]/images/[imageId]/route";
import { GET as getPrimaryImage } from "@/app/api/products/[productId]/image/route";

describe("Product Image Route Handlers", () => {
  const testCases = [
    { productId: "26", imageId: "23", fileName: "8017.png" },
    { productId: "27", imageId: "24", fileName: "7005.png" },
    { productId: "28", imageId: "25", fileName: "3115.png" },
    { productId: "30", imageId: "26", fileName: "3110.png" },
    { productId: "31", imageId: "27", fileName: "2807.png" },
  ];

  for (const { productId, imageId, fileName } of testCases) {
    it(`should serve binary image for /api/products/${productId}/images/${imageId} (${fileName})`, async () => {
      const request = new Request(`http://localhost:3000/api/products/${productId}/images/${imageId}`);
      const response = await getImageById(request, {
        params: Promise.resolve({ productId, imageId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/png");
      expect(response.headers.get("Content-Disposition")).toContain(fileName);

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Verify PNG magic bytes 0x89 0x50 0x4E 0x47
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4e);
      expect(buffer[3]).toBe(0x47);
    });
  }

  it("should return 404 for nonexistent product/image", async () => {
    const request = new Request("http://localhost:3000/api/products/99999/images/99999");
    const response = await getImageById(request, {
      params: Promise.resolve({ productId: "99999", imageId: "99999" }),
    });
    expect(response.status).toBe(404);
  });

  it("should serve primary image for /api/products/26/image", async () => {
    const request = new Request("http://localhost:3000/api/products/26/image");
    const response = await getPrimaryImage(request, {
      params: Promise.resolve({ productId: "26" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
  });
});
