"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/data/site";
import { CustomBuildSchema } from "@/lib/form-schema";
import { MultiFileDropzone } from "./MultiFileDropzone";
import "./custom.css";

// The 3D preview is only loaded on demand for the first mesh file
const ModelViewer = dynamic(
  () => import("./ModelViewer").then((m) => m.ModelViewer),
  { ssr: false }
);

type PathKey = "design" | "idea" | "general";
type Status = "idle" | "submitting" | "success" | "error";

interface CustomBuildFormProps {
  /** Pre-selected intent from the contact page fork. */
  path?: PathKey;
}

type FieldErrors = Partial<
  Record<"name" | "email" | "phone" | "message", string>
>;

/**
 * Custom-build enquiry form supporting multiple attachments, client-side validation,
 * and direct backend PostgreSQL persistence + Resend delivery.
 */
export function CustomBuildForm({ path = "general" }: CustomBuildFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Option A ("I have a design") must ship at least one file
  const fileRequired = path === "design";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setFormError(null);

    const parsed = CustomBuildSchema.safeParse({
      name,
      email,
      phone,
      path,
      message,
      _hp: honeypot,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "name" ||
          key === "email" ||
          key === "phone" ||
          key === "message"
        ) {
          next[key] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});

    if (fileRequired && files.length === 0) {
      setFileError("Please attach at least one CAD, STEP, or design file to continue.");
      return;
    }
    setFileError(null);
    setStatus("submitting");

    try {
      const body = new FormData();
      body.set("name", name);
      body.set("email", email);
      body.set("phone", phone);
      body.set("path", path);
      body.set("message", message);
      body.set("_hp", honeypot);

      for (const f of files) {
        body.append("files", f);
      }

      const res = await fetch("/api/custom-build", { method: "POST", body });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ?? "Something went wrong. Please try again."
        );
      }

      setSubmittedRef(data?.reference || null);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setFormError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="custom-form__done" role="status" style={{ borderTop: "4px solid #10b981", background: "#f0fdf4", padding: "2rem", borderRadius: "8px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
        <h2 className="custom-form__done-title" style={{ color: "#065f46", fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Thanks — we’ve received your enquiry!
        </h2>
        {submittedRef && (
          <div style={{ display: "inline-block", background: "#d1fae5", color: "#047857", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Reference #{submittedRef}
          </div>
        )}
        <p className="custom-form__done-note" style={{ color: "#047857", lineHeight: 1.6, fontSize: "0.95rem" }}>
          Our engineering lab will review your brief and reply directly to <strong>{email}</strong>, on behalf of {CONTACT.legalName}.
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";
  const firstMeshFile = files.find((f) => f.name.match(/\.(stl|obj|ply|gltf|glb)$/i));

  return (
    <form className="custom-form" onSubmit={submit} noValidate>
      <FormField
        id="name"
        label="Name"
        value={name}
        onChange={setName}
        error={errors.name}
        required
      />
      <FormField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        required
      />
      <FormField
        id="phone"
        label="Phone number"
        type="tel"
        value={phone}
        onChange={setPhone}
        error={errors.phone}
        placeholder="Optional"
      />
      <FormField
        id="message"
        label="Tell us about the mission"
        value={message}
        onChange={setMessage}
        error={errors.message}
        required
        multiline
      />

      <div className="custom-form__file">
        <MultiFileDropzone
          files={files}
          onFilesChanged={(newFiles) => {
            setFiles(newFiles);
            setFileError(null);
          }}
          onError={(m) => setFileError(m)}
          label={
            fileRequired
              ? "Attach your design files (required)"
              : "Attach designs or reference files (optional)"
          }
          required={fileRequired}
        />
        {fileError && (
          <p className="custom-form__error" role="alert" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
            {fileError}
          </p>
        )}
        {firstMeshFile && <ModelViewer file={firstMeshFile} />}
      </div>

      {/* Honeypot — hidden from users, catches naive bots. */}
      <div className="custom-form__hp" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {formError && (
        <p className="custom-form__error" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" onLight className="custom-form__submit" disabled={submitting}>
        {submitting ? "Sending enquiry…" : "Send enquiry →"}
      </Button>
      <p className="custom-form__legal">
        {CONTACT.legalName} · {CONTACT.address}
      </p>
    </form>
  );
}
