"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { withMotionPreference } from "@/lib/motion";

interface ScrollSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Pin duration as a multiple of viewport height (e.g. 1 = one screen of scroll). */
  scrollDistance?: number;
  /** Pin the section while its timeline scrubs. */
  pin?: boolean;
  /**
   * Refresh ordering for stacked pins. Triggers higher on the page MUST get a higher value so
   * their pin-spacers are measured before later triggers compute their start (GSAP refreshes
   * highest-priority first). Without this, React's mount order ≠ DOM order and later pins engage
   * early. See docs/adr-1 / the scroll-overlap fix.
   */
  refreshPriority?: number;
  /**
   * Below this viewport width, skip the pin/scrub and render the static resting state (same path
   * as reduced-motion). For pinned layouts that don't fit a phone screen and would otherwise clip.
   */
  animateMinWidth?: number;
  /**
   * Build the chapter timeline. Receives a timeline already wired to a pinned,
   * scrubbed ScrollTrigger on this section. Only invoked when motion is allowed —
   * under reduced-motion the section renders its final state instantly.
   */
  onTimeline?: (tl: gsap.core.Timeline, trigger: HTMLElement) => void;
  /**
   * Optional gentle reveal for the reduced-motion (and narrow-width) branch. Runs instead of the
   * default "snap [data-animate] to resting state." Lets a chapter play a one-shot, scroll-INTO-
   * VIEW reveal (no pin, no scrub) so its content still animates in for reduced-motion users
   * rather than appearing pre-drawn. If omitted, the default resting-state snap runs.
   */
  onReducedReveal?: (el: HTMLElement) => void;
}

/**
 * Pinned-chapter primitive. Every scroll story is a ScrollSection: it owns the
 * ScrollTrigger lifecycle and the reduced-motion fallback so individual chapters
 * never re-implement either. data-animated reflects which path ran (asserted by a11y tests).
 */
export function ScrollSection({
  id,
  children,
  className,
  scrollDistance = 1,
  pin = true,
  refreshPriority = 0,
  animateMinWidth,
  onTimeline,
  onReducedReveal,
}: ScrollSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !onTimeline) return;

      withMotionPreference(
        {
          animated: () => {
            el.setAttribute("data-animated", "true");
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: el,
                start: "top top",
                end: () => `+=${window.innerHeight * scrollDistance}`,
                scrub: 1,
                pin,
                anticipatePin: 1,
                refreshPriority,
                invalidateOnRefresh: true,
              },
            });
            onTimeline(tl, el);
          },
          reduced: () => {
            // No pin, no scrub. Either play a gentle scroll-into-view reveal (if the chapter
            // provides one) or snap everything to its resting state immediately.
            el.setAttribute("data-animated", "false");
            if (onReducedReveal) {
              onReducedReveal(el);
            } else {
              gsap.set(el.querySelectorAll("[data-animate]"), {
                clearProps: "transform,opacity",
              });
            }
          },
        },
        el,
        animateMinWidth,
      );
    },
    { scope: ref },
  );

  return (
    <section id={id} ref={ref} className={className} data-animated="false">
      {children}
    </section>
  );
}
