"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Refresh ScrollTrigger AFTER layout settles — fonts swapping and images loading
 * change element heights, which invalidates pin start/end measurements (risk R9).
 * Recomputes once fonts are ready and once the window load event fires.
 */
export function useScrollRefresh(): void {
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => {});
    }
    window.addEventListener("load", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
    };
  }, []);
}
