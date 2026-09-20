import "./ui.css";

interface SectionLabelProps {
  children: string;
  /** Adjust color for light "breather" sections. */
  onLight?: boolean;
}

/** Small uppercase eyebrow with a thin red rule. Top-left of each chapter (design-brief §7). */
export function SectionLabel({ children, onLight = false }: SectionLabelProps) {
  return (
    <span className={`section-label${onLight ? " section-label--on-light" : ""}`}>
      {children}
    </span>
  );
}
