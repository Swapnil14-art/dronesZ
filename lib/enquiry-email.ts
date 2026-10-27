import { Resend } from "resend";
import { CONTACT, SITE } from "@/data/site";

export interface CartEnquiryItem {
  productId: number;
  productName: string;
  productType?: string;
  sku?: string;
  quantity: number;
  price?: number;
  subtotal?: number;
  productImage?: string;
}

export interface CartEnquiryDetails {
  enquiryRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  submittedAt: string;
  items: CartEnquiryItem[];
  totalItems: number;
  indicativeTotal?: number;
  siteUrl?: string;
}

export interface EmailTransportResult {
  ok: boolean;
  error?: string;
  messageId?: string;
  transportUsed?: string;
}

export interface EmailTransport {
  name: string;
  send(options: {
    to: string;
    from: string;
    replyTo: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<EmailTransportResult>;
}

export function formatEnquiryEmailSubject(details: CartEnquiryDetails): string {
  return `[Hardware Enquiry] ${details.enquiryRef} — ${details.customerName} (${details.totalItems} item${details.totalItems === 1 ? '' : 's'})`;
}

export function formatEnquiryEmailText(details: CartEnquiryDetails): string {
  const siteUrl = details.siteUrl || "https://dronesz.in";
  const dateFormatted = new Date(details.submittedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const lines: string[] = [
    `=============================================================`,
    `DRONESZ AIRBORNE SYSTEMS — HARDWARE QUOTATION & ENQUIRY`,
    `=============================================================`,
    `Enquiry Reference: ${details.enquiryRef}`,
    `Submitted At:      ${dateFormatted} (IST)`,
    ``,
    `CUSTOMER PROFILE`,
    `-------------------------------------------------------------`,
    `Name:              ${details.customerName}`,
    `Registered Email:  ${details.customerEmail}`,
    `Contact Phone:     ${details.customerPhone || "Not provided in profile"}`,
    ``,
    `PROJECT & ENQUIRY NOTES`,
    `-------------------------------------------------------------`,
    details.notes && details.notes.trim()
      ? details.notes.trim()
      : "No special notes or instructions provided.",
    ``,
    `REQUESTED HARDWARE COMPONENTS (${details.totalItems} items)`,
    `-------------------------------------------------------------`,
  ];

  details.items.forEach((item, idx) => {
    const itemNum = idx + 1;
    const priceStr = item.price && item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Quotation upon request";
    const subtotalStr = item.subtotal && item.subtotal > 0 ? `₹${item.subtotal.toLocaleString("en-IN")}` : "To be quoted";
    const productLink = `${siteUrl}/products/${item.productId}`;

    lines.push(
      `${itemNum}. ${item.productName}`,
      `   Product ID:     #${item.productId}${item.sku ? ` (SKU: ${item.sku})` : ""}`,
      `   Classification: ${item.productType || "Hardware Component"}`,
      `   Requested Qty:  ${item.quantity} unit${item.quantity === 1 ? "" : "s"}`,
      `   Indicative Unit:${priceStr}`,
      `   Est. Subtotal:  ${subtotalStr}`,
      `   Product URL:    ${productLink}`,
      ``
    );
  });

  if (details.indicativeTotal && details.indicativeTotal > 0) {
    lines.push(
      `-------------------------------------------------------------`,
      `Estimated Hardware Subtotal: ₹${details.indicativeTotal.toLocaleString("en-IN")}`,
      `* Final commercial proposal, GST invoicing, and dispatch timelines will be confirmed in official reply.`,
      `-------------------------------------------------------------`
    );
  }

  lines.push(
    ``,
    `-------------------------------------------------------------`,
    `This enquiry was dispatched from an authenticated customer session on the Dronesz store portal.`,
    `Reply directly to this email to contact the customer (${details.customerEmail}).`,
    `DronesZ Airborne Systems Pvt. Ltd. · Indore, MP`
  );

  return lines.join("\n");
}

export function formatEnquiryEmailHtml(details: CartEnquiryDetails): string {
  const siteUrl = details.siteUrl || "https://dronesz.in";
  const dateFormatted = new Date(details.submittedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const itemsHtml = details.items
    .map((item, idx) => {
      const priceStr = item.price && item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Quote required";
      const subtotalStr = item.subtotal && item.subtotal > 0 ? `₹${item.subtotal.toLocaleString("en-IN")}` : "—";
      const productLink = `${siteUrl}/products/${item.productId}`;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 10px; font-weight: 700; color: #0f172a;">${idx + 1}</td>
          <td style="padding: 12px 10px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 15px;">
              <a href="${productLink}" style="color: #0f172a; text-decoration: none;">${item.productName}</a>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ID: #${item.productId} ${item.sku ? `· SKU: ${item.sku}` : ""} · Type: ${item.productType || "Component"}
            </div>
          </td>
          <td style="padding: 12px 10px; text-align: center; font-weight: 700; font-size: 14px; color: #0f172a;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 10px; text-align: right; font-size: 13px; color: #475569;">
            ${priceStr}
          </td>
          <td style="padding: 12px 10px; text-align: right; font-weight: 700; font-size: 14px; color: #b91c1c;">
            ${subtotalStr}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hardware Quotation Enquiry</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">
    <!-- Header -->
    <div style="background: #0f172a; padding: 24px 30px; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #e52b31; text-transform: uppercase;">
        DronesZ Airborne Systems · Official Enquiry
      </div>
      <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        Hardware Quotation Request
      </h1>
      <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
        Reference: <strong style="color: #38bdf8;">${details.enquiryRef}</strong> · ${dateFormatted}
      </div>
    </div>

    <!-- Customer Card -->
    <div style="padding: 24px 30px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
        Customer Information
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
        <div><strong>Name:</strong> ${details.customerName}</div>
        <div><strong>Email:</strong> <a href="mailto:${details.customerEmail}" style="color: #0284c7;">${details.customerEmail}</a></div>
        <div><strong>Phone:</strong> ${details.customerPhone || "Not specified"}</div>
        <div><strong>Account Status:</strong> Authenticated User</div>
      </div>
      ${
        details.notes && details.notes.trim()
          ? `<div style="margin-top: 14px; padding: 12px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #0f172a;">Customer Notes:</strong><br>
              ${details.notes.trim().replace(/\n/g, "<br>")}
            </div>`
          : ""
      }
    </div>

    <!-- Items Table -->
    <div style="padding: 24px 30px;">
      <h2 style="margin: 0 0 16px; font-size: 15px; font-weight: 800; color: #0f172a;">
        Requested Components (${details.totalItems} items)
      </h2>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; background: #f8fafc;">
            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569;">#</th>
            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569;">Component &amp; Details</th>
            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: center;">Qty</th>
            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right;">Unit Price</th>
            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${
        details.indicativeTotal && details.indicativeTotal > 0
          ? `
        <div style="margin-top: 20px; padding: 14px; background: #f8fafc; border-radius: 6px; text-align: right; font-size: 14px;">
          <span style="color: #64748b;">Indicative Catalog Subtotal:</span>
          <strong style="font-size: 18px; color: #0f172a; margin-left: 10px;">₹${details.indicativeTotal.toLocaleString("en-IN")}</strong>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Excludes applicable GST, shipping logistics, and custom discounts.</div>
        </div>
      `
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
      This email was automatically generated from an authenticated customer inquiry on <a href="${siteUrl}" style="color: #0284c7;">DronesZ India</a>.<br>
      DronesZ Airborne Systems Pvt. Ltd. · Indore, Madhya Pradesh
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Resend Email Transport implementation
 */
export class ResendEmailTransport implements EmailTransport {
  name = "Resend";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: {
    to: string;
    from: string;
    replyTo: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<EmailTransportResult> {
    try {
      const resend = new Resend(this.apiKey);
      const res = await resend.emails.send({
        from: options.from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (res.error) {
        return { ok: false, error: res.error.message, transportUsed: this.name };
      }
      return { ok: true, messageId: res.data?.id, transportUsed: this.name };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to deliver via Resend", transportUsed: this.name };
    }
  }
}

/**
 * Resolver for the active email transport.
 * Allows injecting custom/mock transports for testing or switching between SMTP and Resend.
 */
let activeTransportOverride: EmailTransport | null = null;

export function setEmailTransportOverride(transport: EmailTransport | null) {
  activeTransportOverride = transport;
}

export function resolveEmailTransport(): EmailTransport | null {
  if (activeTransportOverride) {
    return activeTransportOverride;
  }

  // 1. Check for RESEND_API_KEY
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return new ResendEmailTransport(process.env.RESEND_API_KEY.trim());
  }

  // No active transport configured (Resend is the sole required email provider)
  return null;
}

/**
 * Primary dispatch function for Cart Enquiries.
 * Strictly verifies transport existence and delivers to the administrator address.
 */
export async function sendCartEnquiryEmail(details: CartEnquiryDetails): Promise<EmailTransportResult> {
  const transport = resolveEmailTransport();

  // If no transport exists, NEVER fabricate delivery or claim false success
  if (!transport) {
    return {
      ok: false,
      error: "Email delivery transport is not configured on the server. RESEND_API_KEY is not set. Please contact sales@dronesz.in directly.",
    };
  }

  const to = process.env.ADMIN_EMAIL || process.env.CONTACT_TO_EMAIL || CONTACT.email;
  const from = process.env.RESEND_FROM || `${SITE.shortName} <onboarding@resend.dev>`;
  const subject = formatEnquiryEmailSubject(details);
  const text = formatEnquiryEmailText(details);
  const html = formatEnquiryEmailHtml(details);

  return await transport.send({
    to,
    from,
    replyTo: details.customerEmail,
    subject,
    text,
    html,
  });
}
