import { Resend } from "resend";
import { CONTACT, SITE } from "@/data/site";

/**
 * Lead-notification email. One place owns the Resend wiring so route handlers stay thin and the
 * "no key configured → log instead of throw" fallback is defined once (keeps local dev and
 * preview deploys working before the client's RESEND_API_KEY lands). A small attachment rides
 * inline; a large file is referenced by its Blob link in the body.
 */

export interface LeadAttachment {
  filename: string;
  content: Buffer;
}

export interface LeadEmail {
  name: string;
  email: string;
  phone?: string;
  path: string;
  message: string;
  /** Present when the file was too large to attach — a public Blob link instead. */
  fileUrl?: string;
  fileName?: string;
  /** Present when the file was small enough to attach directly. */
  attachment?: LeadAttachment;
}

const PATH_LABEL: Record<string, string> = {
  design: "Has a design",
  idea: "Has an idea",
  general: "General enquiry",
};

export function subjectFor(lead: LeadEmail): string {
  return `Custom build — ${PATH_LABEL[lead.path] ?? "enquiry"} — ${lead.name}`;
}

export function bodyText(lead: LeadEmail): string {
  const lines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : null,
    `Path: ${PATH_LABEL[lead.path] ?? lead.path}`,
    "",
    "Message:",
    lead.message,
    "",
    lead.attachment
      ? `File: ${lead.attachment.filename} (attached)`
      : lead.fileUrl
        ? `File: ${lead.fileName ?? "upload"}\n${lead.fileUrl}`
        : "File: none provided",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export interface SendResult {
  ok: boolean;
  /** True when no provider was configured and the lead was logged instead of sent. */
  logged?: boolean;
  error?: string;
}

export async function sendLeadEmail(lead: LeadEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || CONTACT.email;
  // A verified sender the client controls goes in RESEND_FROM; until then Resend's shared
  // onboarding sender lets the flow work end-to-end for testing.
  const from =
    process.env.RESEND_FROM || `${SITE.shortName} <onboarding@resend.dev>`;

  if (!apiKey) {
    // Deliberate operational fallback, not stray debug output: with no provider configured we
    // must not lose the lead, so record it server-side and report success to the visitor.
    console.info(
      "[lead] RESEND_API_KEY unset — lead not emailed:",
      bodyText(lead),
    );
    return { ok: true, logged: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: lead.email,
      subject: subjectFor(lead),
      text: bodyText(lead),
      attachments: lead.attachment
        ? [
            {
              filename: lead.attachment.filename,
              content: lead.attachment.content,
            },
          ]
        : undefined,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "send failed",
    };
  }
}
