"use client";

import { useId, useRef, useState } from "react";
import { ACCEPT_ATTR, MAX_FILE_MB, validateFile } from "@/lib/model-formats";
import "./custom.css";

interface FileDropzoneProps {
  /** The currently-selected file, if any (owned by the parent form). */
  file: File | null;
  onFileSelected: (file: File) => void;
  onCleared: () => void;
  /** Reported when a dropped/picked file fails validation. */
  onError?: (message: string) => void;
}

/**
 * Drag-and-drop + click-to-browse file picker for the custom-build form. Validates type and
 * size at the boundary via the shared model-formats rules before handing the file up. Purely
 * local — the file is only read into a preview here; upload happens on form submit.
 */
export function FileDropzone({
  file,
  onFileSelected,
  onCleared,
  onError,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    const result = validateFile(candidate);
    if (!result.ok) {
      onError?.(result.error ?? "That file can’t be used.");
      return;
    }
    onFileSelected(candidate);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  };

  return (
    <div
      className="dropzone"
      data-dragging={dragging || undefined}
      data-has-file={!!file || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="dropzone__input"
        accept={ACCEPT_ATTR}
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {file ? (
        <div className="dropzone__selected">
          <p className="dropzone__filename">{file.name}</p>
          <div className="dropzone__actions">
            <label htmlFor={inputId} className="dropzone__link">
              Replace
            </label>
            <button type="button" className="dropzone__link" onClick={clear}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={inputId} className="dropzone__prompt">
          <span className="dropzone__title">
            Drag a file here, or <span className="dropzone__browse">browse</span>
          </span>
          <span className="dropzone__hint">
            STL, OBJ, STEP, or an image · up to {MAX_FILE_MB} MB
          </span>
        </label>
      )}
    </div>
  );
}
