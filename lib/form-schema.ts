import { z } from "zod";

/**
 * Shared validation for both lead-capture forms. Used client-side (inline errors) and
 * server-side (route handlers) so trust-boundary validation is identical in both places.
 * `_hp` is a honeypot: real users never fill it; bots do → reject.
 */

const name = z.string().trim().min(2, "Please enter your name").max(120);
const email = z.string().trim().email("Enter a valid email").max(200);
const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+\d][\d\s()-]{5,}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));
const honeypot = z.literal("").optional();

export const ContactFormSchema = z.object({
  name,
  email,
  phone,
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
  _hp: honeypot,
});

export const FramesLeadSchema = z.object({
  name,
  email,
  interest: z.string().trim().min(3, "What frame are you after?").max(500),
  _hp: honeypot,
});

/**
 * Custom-build enquiry. `path` mirrors the contact page's design|idea fork (general when the
 * visitor arrives without one). File handling is separate — small files ride along as a
 * multipart attachment, large ones as a validated Blob `fileUrl` — so only the file's metadata
 * is described here; the bytes/link are validated in the route.
 */
export const CustomBuildSchema = z.object({
  name,
  email,
  phone,
  path: z.enum(["design", "idea", "general"]).default("general"),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
  _hp: honeypot,
});

export type ContactForm = z.infer<typeof ContactFormSchema>;
export type FramesLead = z.infer<typeof FramesLeadSchema>;
export type CustomBuild = z.infer<typeof CustomBuildSchema>;
