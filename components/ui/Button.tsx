import Link from "next/link";
import type { ReactNode } from "react";
import "./ui.css";

type Variant = "primary" | "ghost";

interface BaseProps {
  variant?: Variant;
  /** Styling tweak for use on light "breather" sections. */
  onLight?: boolean;
  children: ReactNode;
  className?: string;
}

interface LinkButtonProps extends BaseProps {
  href: string;
}

interface ActionButtonProps extends BaseProps {
  onClick?: () => void;
  type?: "button" | "submit";
}

function classes(variant: Variant, onLight: boolean, extra?: string): string {
  return [
    "btn",
    `btn--${variant}`,
    onLight ? "btn--on-light" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Link-styled button (navigation / CTAs that route). */
export function LinkButton({
  href,
  variant = "primary",
  onLight = false,
  children,
  className,
}: LinkButtonProps) {
  return (
    <Link href={href} className={classes(variant, onLight, className)}>
      {children}
    </Link>
  );
}

/** Action button (forms, in-page handlers). */
export function Button({
  variant = "primary",
  onLight = false,
  onClick,
  type = "button",
  children,
  className,
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={classes(variant, onLight, className)}
    >
      {children}
    </button>
  );
}
