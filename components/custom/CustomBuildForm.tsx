"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/data/site";
import { CustomBuildSchema } from "@/lib/form-schema";
import { shouldAttach } from "@/lib/model-formats";
import { FileDropzone } from "./FileDropzone";
import "./custom.css";

// The preview (and, through it, the 3D engine) is only needed once a file is chosen — load it
// on demand so the initial contact bundle stays lean. ssr:false: it's a browser-only viewer.
const ModelViewer = dynamic(
  () => import("./ModelViewer").then((m) => m.ModelViewer),
  { ssr: false },
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
 * Custom-build enquiry form. Reuses the Phase-A dropzone + local 3D/image preview, then on
 * submit routes the file by size: small files ride along as a multipart attachment; large ones
 * upload directly to Blob first (bypassing the serverless body cap) and are sent as a link.
 * Client-side validation mirrors the server schema so errors surface inline before any request.
 */
export function CustomBuildForm({ path = "general" }: CustomBuildFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // Option A ("I have a design") must ship a file; Option B / general enquiries are free to
  // send just a brief. Enforced here and again server-side at the trust boundary.
  const fileRequired = path === "design";

  const handleFile = (f: File) => {
    setFile(f);
    setFileError(null);
  };

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

    if (fileRequired && !file) {
      setFileError("Please attach your design file to continue.");
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

      if (file && shouldAttach(file.size)) {
        body.set("file", file);
      } else if (file) {
        // Too large to attach — upload to Blob and send the link instead. The Blob client is
        // imported here (not at module load) so it only ships to visitors who upload a big file.
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: true,
        });
        body.set("fileUrl", blob.url);
        body.set("fileName", file.name);
      }

      const res = await fetch("/api/custom-build", { method: "POST", body });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          data?.error ?? "Something went wrong. Please try again.",
        );
      }
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setFormError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="custom-form__done" role="status">
        <p className="custom-form__done-title">
          Thanks — we’ve got your brief.
        </p>
        <p className="custom-form__done-note">
          Our team will review it and reply to {email} within a business day, on
          behalf of {CONTACT.legalName}.
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

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
        label="Phone"
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
        <p className="custom-form__file-label">
          {fileRequired ? (
            <>
              Attach your design{" "}
              <span className="custom-form__req">(required)</span>
            </>
          ) : (
            "Attach a design or reference (optional)"
          )}
        </p>
        <FileDropzone
          file={file}
          onFileSelected={handleFile}
          onCleared={() => setFile(null)}
          onError={(m) => setFileError(m)}
        />
        {fileError && (
          <p className="custom-form__error" role="alert">
            {fileError}
          </p>
        )}
        {file && <ModelViewer file={file} />}
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

      <Button type="submit" onLight className="custom-form__submit">
        {submitting ? "Sending…" : "Send enquiry →"}
      </Button>
      <p className="custom-form__legal">
        {CONTACT.legalName} · {CONTACT.address}
      </p>
    </form>
  );
}
