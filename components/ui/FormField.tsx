import type { ChangeEvent } from "react";
import "./ui.css";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  /** Render a multi-line textarea instead of an input. */
  multiline?: boolean;
}

/** Accessible labelled field with inline error wiring (aria-invalid / aria-describedby). */
export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  multiline = false,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const handle = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(e.target.value);

  const shared = {
    id,
    name: id,
    value,
    onChange: handle,
    placeholder,
    required,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    className: "field__control",
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={5} />
      ) : (
        <input {...shared} type={type} />
      )}
      {error && (
        <span id={errorId} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
