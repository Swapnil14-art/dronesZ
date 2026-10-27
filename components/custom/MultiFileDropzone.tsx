"use client";

import { useId, useRef, useState } from "react";
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_AGGREGATE_ATTACHMENT_BYTES,
  validateAttachmentFile,
  validateAttachmentList,
  formatBytes,
  fileExtension,
} from "@/lib/model-formats";
import "./custom.css";

interface MultiFileDropzoneProps {
  files: File[];
  onFilesChanged: (files: File[]) => void;
  onError?: (message: string | null) => void;
  label?: string;
  hint?: string;
  required?: boolean;
}

export function MultiFileDropzone({
  files,
  onFilesChanged,
  onError,
  label = "Attach Files & CAD Models",
  hint = "STL, STEP, OBJ, DXF, PDF, Images, or ZIP · up to 15 MB per file, 25 MB total",
  required = false,
}: MultiFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const handleAddFiles = (incoming: FileList | File[] | null | undefined) => {
    if (!incoming || incoming.length === 0) return;
    onError?.(null);

    const newFiles = Array.from(incoming);

    // Validate incoming individual files
    for (const f of newFiles) {
      const check = validateAttachmentFile(f);
      if (!check.ok) {
        onError?.(check.error || "Unsupported file format.");
        return;
      }
    }

    // Merge without exact duplicates (same name and size)
    const merged = [...files];
    for (const f of newFiles) {
      const exists = merged.some(
        (existing) => existing.name === f.name && existing.size === f.size
      );
      if (!exists) {
        merged.push(f);
      }
    }

    // Validate aggregate list
    const aggregateCheck = validateAttachmentList(merged);
    if (!aggregateCheck.ok) {
      onError?.(aggregateCheck.error || "Total attachments exceed size limits.");
      return;
    }

    onFilesChanged(merged);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    onError?.(null);
    const updated = files.filter((_, i) => i !== index);
    onFilesChanged(updated);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const acceptAttr = [
    ...ALLOWED_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`),
    "image/*",
    "application/pdf",
    "application/zip",
  ].join(",");

  return (
    <div className="multi-dropzone-wrap" style={{ width: "100%", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <label htmlFor={inputId} style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-on-surface, #0f172a)" }}>
          {label} {required && <span style={{ color: "#e52b31" }}>*</span>}
        </label>
        {files.length > 0 && (
          <span style={{ fontSize: "12px", color: totalBytes > MAX_AGGREGATE_ATTACHMENT_BYTES ? "#e52b31" : "var(--color-muted, #64748b)" }}>
            {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} / 25 MB max
          </span>
        )}
      </div>

      <div
        className="dropzone"
        data-dragging={dragging || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: dragging ? "2px dashed var(--color-primary, #e52b31)" : "1px dashed var(--color-outline, #cbd5e1)",
          borderRadius: "6px",
          padding: files.length > 0 ? "1rem" : "1.75rem 1rem",
          background: dragging ? "#fef2f2" : "#f8fafc",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          className="dropzone__input"
          accept={acceptAttr}
          onChange={(e) => handleAddFiles(e.target.files)}
          style={{ display: "none" }}
        />

        <label htmlFor={inputId} style={{ cursor: "pointer", display: "block" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📎</div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-on-surface, #0f172a)" }}>
            Drag and drop files here, or <span style={{ color: "var(--color-primary, #e52b31)", textDecoration: "underline" }}>browse</span>
          </span>
          <div style={{ fontSize: "12px", color: "var(--color-muted, #64748b)", marginTop: "0.25rem" }}>
            {hint}
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {files.map((file, idx) => {
            const ext = fileExtension(file.name).toUpperCase() || "FILE";
            return (
              <div
                key={`${file.name}-${file.size}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {ext}
                  </span>
                  <span style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis" }} title={file.name}>
                    {file.name}
                  </span>
                  <span style={{ color: "#64748b", fontSize: "12px", flexShrink: 0 }}>
                    ({formatBytes(file.size)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "4px 8px",
                    fontWeight: 700,
                  }}
                  title="Remove this file"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}

          <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
            <label
              htmlFor={inputId}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-primary, #e52b31)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              + Add more files
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
