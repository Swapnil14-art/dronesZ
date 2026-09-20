"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import "@/components/ui/ui.css";

/** Polymorphic host tag that still accepts a forwarded ref + our data attribute. */
type PolymorphicTag = ComponentType<
  HTMLAttributes<HTMLElement> & {
    ref?: Ref<HTMLElement>;
    "data-visible"?: boolean;
  }
>;

/**
 * Reveal-on-enter wrapper (design-brief §5): fade + rise on compositor props only, once.
 * Pure CSS transition + a one-shot IntersectionObserver — no animation library, so this
 * stays out of the initial JS chunk (protects the <150kB budget; `motion` in the shared
 * chain was the pre-pivot 178kB regression). Reduced-motion users get the resting state
 * immediately via the media query in ui.css.
 */
interface AnimatedTextProps {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}

export function AnimatedText({
  children,
  delay = 0,
  as = "div",
  className,
}: AnimatedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "-10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as unknown as PolymorphicTag;
  return (
    <Tag
      ref={ref}
      className={["anim-text", className].filter(Boolean).join(" ")}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}
