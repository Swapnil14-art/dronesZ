import { Resend } from "resend";
import { CONTACT, SITE } from "@/data/site";
import type { EnquiryRecord } from "./db";
import fs from "node:fs";
import path from "node:path";

function getFreshEnv(key: string): string | undefined {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return process.env[key];
  }

  try {
    const envPath = path.resolve(process.cwd(), "drone-store-system/.env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        if (k === key) {
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val) return val;
        }
      }
    }
  } catch {
    // Fall back to process.env
  }
  return process.env[key];
}

// Resend limits & Base64 overhead constraints
// Resend max payload is 40 MB. Base64 encoding adds ~33% overhead.
// Max safe aggregate raw file size is 25 MB (26,214,400 bytes).
export const MAX_AGGREGATE_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_INDIVIDUAL_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export interface AttachmentForDelivery {
  filename: string;
  contentType: string;
  buffer: Buffer;
  fileSize?: number;
}

export interface DeliveryResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// Mock client override for automated unit tests
let resendClientOverride: any = null;

export function setResendClientOverride(override: any): void {
  resendClientOverride = override;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function getHumanReadableType(type: string): string {
  switch (type) {
    case "contact_general":
    case "general":
      return "General Business Enquiry";
    case "contact_design":
    case "design":
      return "Custom Build — Client Design (CAD/STEP)";
    case "contact_idea":
    case "idea":
      return "Custom Build — Concept & Requirements";
    case "build_your_own_drone":
      return "Build Your Own Drone (BYOD) Configuration";
    case "cart_enquiry":
      return "Hardware Components Quotation Cart";
    default:
      return type.replace(/_/g, " ").toUpperCase();
  }
}

export function formatEnquirySubject(enquiry: EnquiryRecord): string {
  const typeLabel = getHumanReadableType(enquiry.enquiryType);
  return `[${SITE.shortName} Enquiry] ${enquiry.reference} — ${typeLabel} — ${enquiry.customerName}`;
}

export function formatEnquiryText(
  enquiry: EnquiryRecord,
  attachments: AttachmentForDelivery[] = []
): string {
  const dateFormatted = new Date(enquiry.createdAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const lines: string[] = [
    `=============================================================`,
    `DRONESZ AIRBORNE SYSTEMS — CUSTOMER ENQUIRY & LEAD`,
    `=============================================================`,
    `Reference:     ${enquiry.reference}`,
    `Type:          ${getHumanReadableType(enquiry.enquiryType)}`,
    `Submitted At:  ${dateFormatted} (IST)`,
    ``,
    `CUSTOMER INFORMATION`,
    `-------------------------------------------------------------`,
    `Name:          ${enquiry.customerName}`,
    `Email:         ${enquiry.customerEmail}`,
    `Phone:         ${enquiry.customerPhone || "Not provided"}`,
    ``,
  ];

  if (enquiry.specifications && Object.keys(enquiry.specifications).length > 0) {
    lines.push(`TECHNICAL SPECIFICATIONS & REQUIREMENTS`);
    lines.push(`-------------------------------------------------------------`);
    for (const [key, value] of Object.entries(enquiry.specifications)) {
      if (value !== null && value !== undefined && value !== "") {
        const readableKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase());
        lines.push(`${readableKey.padEnd(22)}: ${value}`);
      }
    }
    lines.push(``);
  }

  if (enquiry.productItems && enquiry.productItems.length > 0) {
    lines.push(`REQUESTED HARDWARE COMPONENTS (${enquiry.totalItems} items)`);
    lines.push(`-------------------------------------------------------------`);
    enquiry.productItems.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.productName || "Hardware Item"}`);
      lines.push(`   Product ID:     #${item.productId}`);
      if (item.productType) lines.push(`   Classification: ${item.productType}`);
      lines.push(`   Requested Qty:  ${item.quantity} unit${item.quantity === 1 ? "" : "s"}`);
      if (item.price) lines.push(`   Indicative Unit:₹${Number(item.price).toLocaleString("en-IN")}`);
      if (item.subtotal) lines.push(`   Est. Subtotal:  ₹${Number(item.subtotal).toLocaleString("en-IN")}`);
      lines.push(``);
    });
    if (enquiry.indicativeTotal) {
      lines.push(`Estimated Total Value: ₹${Number(enquiry.indicativeTotal).toLocaleString("en-IN")}`);
      lines.push(``);
    }
  }

  if (enquiry.message && enquiry.message.trim()) {
    lines.push(`CUSTOMER MESSAGE & NOTES`);
    lines.push(`-------------------------------------------------------------`);
    lines.push(enquiry.message.trim());
    lines.push(``);
  }

  lines.push(`ATTACHMENTS (${attachments.length} files)`);
  lines.push(`-------------------------------------------------------------`);
  if (attachments.length === 0) {
    lines.push(`No files attached.`);
  } else {
    attachments.forEach((att, i) => {
      lines.push(`${i + 1}. ${att.filename} (${formatBytes(att.buffer.length)}, ${att.contentType})`);
    });
  }
  lines.push(``);
  lines.push(`-------------------------------------------------------------`);
  lines.push(`This email was dispatched from an authenticated enquiry workflow on Dronesz.`);
  lines.push(`Reply directly to this email to contact the customer (${enquiry.customerEmail}).`);

  return lines.join("\n");
}

export function formatEnquiryHtml(
  enquiry: EnquiryRecord,
  attachments: AttachmentForDelivery[] = []
): string {
  const dateFormatted = new Date(enquiry.createdAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  let specsHtml = "";
  if (enquiry.specifications && Object.keys(enquiry.specifications).length > 0) {
    const rows = Object.entries(enquiry.specifications)
      .filter(([_, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => {
        const readableKey = k
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase());
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; width: 35%;">${escapeHtml(readableKey)}</td>
            <td style="padding: 8px 12px; color: #0f172a; font-weight: 500;">${escapeHtml(String(v))}</td>
          </tr>
        `;
      })
      .join("");

    if (rows) {
      specsHtml = `
        <div style="margin-top: 24px;">
          <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
            Technical Specifications &amp; Requirements
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; overflow: hidden;">
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }
  }

  let itemsHtml = "";
  if (enquiry.productItems && enquiry.productItems.length > 0) {
    const itemRows = enquiry.productItems
      .map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: 700; color: #0f172a;">${idx + 1}</td>
          <td style="padding: 10px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${escapeHtml(item.productName || "Hardware Item")}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">ID: #${item.productId} ${item.productType ? `· Type: ${escapeHtml(item.productType)}` : ""}</div>
          </td>
          <td style="padding: 10px; text-align: center; font-weight: 700;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; color: #475569;">${item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "Quote required"}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #b91c1c;">${item.subtotal ? `₹${Number(item.subtotal).toLocaleString("en-IN")}` : "—"}</td>
        </tr>
      `)
      .join("");

    itemsHtml = `
      <div style="margin-top: 24px;">
        <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
          Requested Hardware Components (${enquiry.totalItems} items)
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; overflow: hidden;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569;">#</th>
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569;">Component</th>
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: center;">Qty</th>
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right;">Unit Price</th>
              <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${
          enquiry.indicativeTotal
            ? `
          <div style="text-align: right; margin-top: 10px; font-size: 14px;">
            <strong>Estimated Material Total:</strong> <span style="font-size: 16px; font-weight: 800; color: #b91c1c;">₹${Number(enquiry.indicativeTotal).toLocaleString("en-IN")}</span>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  let messageHtml = "";
  if (enquiry.message && enquiry.message.trim()) {
    messageHtml = `
      <div style="margin-top: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
          Customer Message &amp; Notes
        </h2>
        <div style="padding: 14px 16px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
          ${escapeHtml(enquiry.message.trim())}
        </div>
      </div>
    `;
  }

  let attachmentsHtml = "";
  if (attachments.length > 0) {
    const attRows = attachments
      .map(
        (att, idx) => `
        <li style="margin-bottom: 6px;">
          <strong>${idx + 1}. ${escapeHtml(att.filename)}</strong> 
          <span style="color: #64748b; font-size: 12px;">(${formatBytes(att.buffer.length)} · ${escapeHtml(att.contentType)}) [Directly Attached]</span>
        </li>
      `
      )
      .join("");

    attachmentsHtml = `
      <div style="margin-top: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
          File Attachments (${attachments.length} files attached)
        </h2>
        <ul style="padding-left: 20px; font-size: 13px; color: #0f172a; margin: 0;">
          ${attRows}
        </ul>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(formatEnquirySubject(enquiry))}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">
    <!-- Header -->
    <div style="background: #0f172a; padding: 24px 30px; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #e52b31; text-transform: uppercase;">
        DronesZ Airborne Systems · Official Customer Enquiry
      </div>
      <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
        ${escapeHtml(getHumanReadableType(enquiry.enquiryType))}
      </h1>
      <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
        Reference: <strong style="color: #38bdf8;">${escapeHtml(enquiry.reference)}</strong> · ${escapeHtml(dateFormatted)}
      </div>
    </div>

    <!-- Customer Details Card -->
    <div style="padding: 24px 30px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
        Customer Information
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
        <div><strong>Name:</strong> ${escapeHtml(enquiry.customerName)}</div>
        <div><strong>Email:</strong> <a href="mailto:${escapeHtml(enquiry.customerEmail)}" style="color: #0284c7;">${escapeHtml(enquiry.customerEmail)}</a></div>
        <div><strong>Phone:</strong> ${enquiry.customerPhone ? `<a href="tel:${escapeHtml(enquiry.customerPhone)}" style="color: #0284c7;">${escapeHtml(enquiry.customerPhone)}</a>` : "Not provided"}</div>
        <div><strong>Enquiry Type:</strong> ${escapeHtml(getHumanReadableType(enquiry.enquiryType))}</div>
      </div>
    </div>

    <!-- Content Sections -->
    <div style="padding: 24px 30px;">
      ${specsHtml}
      ${itemsHtml}
      ${messageHtml}
      ${attachmentsHtml}
    </div>

    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
      This email was automatically generated from an authenticated customer inquiry on <a href="https://dronesz.in" style="color: #0284c7;">DronesZ India</a>.<br>
      Reply directly to this email to contact the customer (<a href="mailto:${escapeHtml(enquiry.customerEmail)}" style="color: #0284c7;">${escapeHtml(enquiry.customerEmail)}</a>).<br>
      DronesZ Airborne Systems Pvt. Ltd. · Indore, Madhya Pradesh
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendEnquiryEmail(
  enquiry: EnquiryRecord,
  attachments: AttachmentForDelivery[] = []
): Promise<DeliveryResult> {
  const apiKey = getFreshEnv("RESEND_API_KEY") || process.env.RESEND_API_KEY;
  const to =
    getFreshEnv("ADMIN_EMAIL") ||
    getFreshEnv("CONTACT_TO_EMAIL") ||
    process.env.ADMIN_EMAIL ||
    process.env.CONTACT_TO_EMAIL ||
    CONTACT.email;
  const from =
    getFreshEnv("RESEND_FROM") ||
    process.env.RESEND_FROM ||
    `${SITE.shortName} Enquiries <onboarding@resend.dev>`;

  // Enforce attachment size limit before calling Resend
  const totalAttachmentBytes = attachments.reduce((sum, att) => sum + att.buffer.length, 0);
  if (totalAttachmentBytes > MAX_AGGREGATE_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `Total attachment size (${formatBytes(totalAttachmentBytes)}) exceeds the allowed 25 MB limit for email delivery.`,
    };
  }

  // Check for test mock client override
  if (resendClientOverride) {
    try {
      const res = await resendClientOverride.emails.send({
        from,
        to,
        replyTo: enquiry.customerEmail,
        subject: formatEnquirySubject(enquiry),
        text: formatEnquiryText(enquiry, attachments),
        html: formatEnquiryHtml(enquiry, attachments),
        attachments: attachments.map((att) => ({
          filename: att.filename,
          content: att.buffer,
        })),
      });
      if (res.error) {
        return { ok: false, error: res.error.message || "Resend mock error" };
      }
      return { ok: true, messageId: res.data?.id || "mock-id" };
    } catch (err: any) {
      return { ok: false, error: err.message || "Mock send error" };
    }
  }

  // Production check: Strict validation, NO silent fallback
  if (!apiKey || !apiKey.trim()) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not configured on the server. Please set RESEND_API_KEY in environment variables.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: enquiry.customerEmail,
      subject: formatEnquirySubject(enquiry),
      text: formatEnquiryText(enquiry, attachments),
      html: formatEnquiryHtml(enquiry, attachments),
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.buffer,
      })),
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, messageId: data?.id };
  } catch (err: any) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error delivering email through Resend.",
    };
  }
}
