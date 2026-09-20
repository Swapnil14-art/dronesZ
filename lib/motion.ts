import gsap from "gsap";

/** Synchronous check for reduced-motion preference. SSR-safe (returns false on server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface MotionBranches {
  /** Build the full scroll-driven timeline. Runs only when motion is allowed. */
  animated: () => void;
  /** Snap to the final visual state instantly. No timelines, no pin. */
  reduced: () => void;
}

/**
 * Gate every scroll timeline behind prefers-reduced-motion via gsap.matchMedia().
 * matchMedia auto-cleans the matching branch when the media query stops matching
 * (and useGSAP reverts it on unmount when scoped). Reduced-motion is a first-class
 * path, not an afterthought (docs/research.md §1).
 *
 * @param scope optional element scope so selectors resolve locally and revert cleanly.
 * @param animateMinWidth if set, the animated (pinned) branch only runs at or above this
 *   viewport width; narrower screens take the static `reduced` branch too. Use for pinned
 *   layouts that can't fit a phone viewport — they degrade to the resting state instead of
 *   clipping. Reactive: gsap.matchMedia re-evaluates on resize/rotate.
 */
export function withMotionPreference(
  branches: MotionBranches,
  scope?: Element | null,
  animateMinWidth?: number,
): gsap.MatchMedia {
  const mm = scope ? gsap.matchMedia(scope) : gsap.matchMedia();
  const widthClause = animateMinWidth
    ? ` and (min-width: ${animateMinWidth}px)`
    : "";
  mm.add(
    `(prefers-reduced-motion: no-preference)${widthClause}`,
    branches.animated,
  );
  // The static path also covers narrow viewports when an animateMinWidth gate is set.
  const reducedQuery = animateMinWidth
    ? `(prefers-reduced-motion: reduce), (max-width: ${animateMinWidth - 1}px)`
    : "(prefers-reduced-motion: reduce)";
  mm.add(reducedQuery, branches.reduced);
  return mm;
}
