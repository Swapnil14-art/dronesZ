import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  formatEnquirySubject,
  formatEnquiryText,
  formatEnquiryHtml,
  sendEnquiryEmail,
  setResendClientOverride,
  MAX_AGGREGATE_ATTACHMENT_BYTES,
  type AttachmentForDelivery,
} from "./resend-service";
import type { EnquiryRecord } from "./db";

const mockEnquiry: EnquiryRecord = {
  id: 42,
  reference: "DZ-ENQ-20261028-TEST01",
  enquiryType: "contact_design",
  customerName: "Dr. Vikram Sarabhai",
  customerEmail: "vikram@isro.gov.in",
  customerPhone: "+91 98765 43210",
  message: "Requesting custom airframe fabrication with carbon-fiber reinforcement.",
  specifications: {
    wingspan: "1800mm",
    flightTime: "60 mins",
    payloadWeight: "2.5 kg",
  },
  productItems: [],
  totalItems: 0,
  indicativeTotal: 0,
  deliveryStatus: "PENDING",
  deliveryError: null,
  deliveryAttempts: 0,
  createdAt: "2026-10-28T05:30:00.000Z",
  updatedAt: "2026-10-28T05:30:00.000Z",
};

const mockCartEnquiry: EnquiryRecord = {
  id: 43,
  reference: "DZ-ENQ-20261028-CART01",
  enquiryType: "cart_enquiry",
  customerName: "Aarav Sharma",
  customerEmail: "aarav@example.com",
  customerPhone: "+91 99999 88888",
  message: "Expedited delivery quotation required.",
  specifications: null,
  productItems: [
    {
      productId: 101,
      productName: "DZ-Brushless Motor 2207",
      productType: "Motor",
      quantity: 4,
      price: 2500,
      subtotal: 10000,
    },
  ],
  totalItems: 4,
  indicativeTotal: 10000,
  deliveryStatus: "PENDING",
  deliveryError: null,
  deliveryAttempts: 0,
  createdAt: "2026-10-28T05:30:00.000Z",
  updatedAt: "2026-10-28T05:30:00.000Z",
};

describe("formatEnquirySubject", () => {
  it("formats subject with reference, human readable type, and customer name", () => {
    const subject = formatEnquirySubject(mockEnquiry);
    expect(subject).toContain("DZ-ENQ-20261028-TEST01");
    expect(subject).toContain("Custom Build — Client Design");
    expect(subject).toContain("Dr. Vikram Sarabhai");
  });

  it("handles cart enquiry subjects appropriately", () => {
    const subject = formatEnquirySubject(mockCartEnquiry);
    expect(subject).toContain("DZ-ENQ-20261028-CART01");
    expect(subject).toContain("Hardware Components Quotation Cart");
    expect(subject).toContain("Aarav Sharma");
  });
});

describe("formatEnquiryText", () => {
  it("includes all customer information, specifications, and message", () => {
    const text = formatEnquiryText(mockEnquiry);
    expect(text).toContain("Reference:     DZ-ENQ-20261028-TEST01");
    expect(text).toContain("Dr. Vikram Sarabhai");
    expect(text).toContain("vikram@isro.gov.in");
    expect(text).toContain("+91 98765 43210");
    expect(text).toContain("Wingspan              : 1800mm");
    expect(text).toContain("Flight Time           : 60 mins");
    expect(text).toContain("Requesting custom airframe fabrication");
  });

  it("lists direct attachments with filenames and sizes in plain text", () => {
    const attachments: AttachmentForDelivery[] = [
      {
        filename: "wing_spar.stl",
        contentType: "application/octet-stream",
        buffer: Buffer.from("model-data"),
      },
    ];
    const text = formatEnquiryText(mockEnquiry, attachments);
    expect(text).toContain("ATTACHMENTS (1 files)");
    expect(text).toContain("1. wing_spar.stl");
  });
});

describe("formatEnquiryHtml", () => {
  it("escapes user-supplied content to prevent HTML injection", () => {
    const dangerousEnquiry: EnquiryRecord = {
      ...mockEnquiry,
      customerName: "<script>alert('xss')</script>John Doe",
      message: "<img src=x onerror=alert(1)>Special request",
      specifications: {
        customNote: "<b>bold</b> payload",
      },
    };
    const html = formatEnquiryHtml(dangerousEnquiry);

    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;John Doe");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;Special request");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt; payload");
  });

  it("renders cart component tables and totals", () => {
    const html = formatEnquiryHtml(mockCartEnquiry);
    expect(html).toContain("DZ-Brushless Motor 2207");
    expect(html).toContain("₹10,000");
    expect(html).toContain("4 items");
  });
});

describe("sendEnquiryEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    setResendClientOverride(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setResendClientOverride(null);
  });

  it("fails with clear error when RESEND_API_KEY is missing (never fakes success)", async () => {
    const result = await sendEnquiryEmail(mockEnquiry, []);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("RESEND_API_KEY is not configured");
  });

  it("rejects aggregate attachments exceeding 25 MB before sending to Resend", async () => {
    const hugeAttachment: AttachmentForDelivery = {
      filename: "massive_mesh.obj",
      contentType: "application/octet-stream",
      buffer: Buffer.alloc(MAX_AGGREGATE_ATTACHMENT_BYTES + 1024),
    };

    const result = await sendEnquiryEmail(mockEnquiry, [hugeAttachment]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("exceeds the allowed 25 MB limit");
  });

  it("delivers successfully with mock client and passes attachments", async () => {
    let capturedPayload: any = null;
    const mockResendClient = {
      emails: {
        send: async (payload: any) => {
          capturedPayload = payload;
          return { data: { id: "resend_msg_test_999" }, error: null };
        },
      },
    };

    setResendClientOverride(mockResendClient);

    const attachments: AttachmentForDelivery[] = [
      {
        filename: "blueprint.step",
        contentType: "application/step",
        buffer: Buffer.from("cad-binary-content"),
      },
    ];

    const result = await sendEnquiryEmail(mockEnquiry, attachments);
    expect(result.ok).toBe(true);
    expect(result.messageId).toBe("resend_msg_test_999");
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.replyTo).toBe("vikram@isro.gov.in");
    expect(capturedPayload.attachments).toHaveLength(1);
    expect(capturedPayload.attachments[0].filename).toBe("blueprint.step");
  });

  it("handles Resend provider API rejection gracefully", async () => {
    const mockFailingClient = {
      emails: {
        send: async () => {
          return {
            data: null,
            error: { message: "Domain not verified on Resend" },
          };
        },
      },
    };

    setResendClientOverride(mockFailingClient);

    const result = await sendEnquiryEmail(mockEnquiry, []);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Domain not verified on Resend");
  });
});
