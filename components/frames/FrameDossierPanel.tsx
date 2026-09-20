"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollSection } from "@/components/scroll/ScrollSection";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FRAME_BOX_ASPECT, type FrameStory } from "@/data/frames";
import type { FrameCallout } from "@/data/frame-callouts";
import "./frames.css";

/**
 * Engineering-dossier panel: the real exploded flat-lay photo as a specimen, with red annotation
 * leader-lines that DRAW to labelled callouts as the pin scrubs (motion bound to scroll, not a
 * fade). Deliberately the inverse of the hero's "assembled" cinematic: this is the parts, labelled.
 * Reduced-motion / no-JS: ScrollSection stays data-animated="false" → lines drawn + labels shown
 * via CSS (see frames.css), first-class fallback.
 *
 * NOTE: the "▶ Play assembly" clip toggle is parked until the Veo clips land — the video data model
 * (story.video) and its CSS remain so it can be re-wired here without touching the layout.
 */
/** The three annotation layers a reveal animates. */
const collect = (el: HTMLElement) => ({
  lines: el.querySelectorAll<SVGLineElement>(".dossier__line"),
  dots: el.querySelectorAll<HTMLElement>(".dossier__dot"),
  labels: el.querySelectorAll<HTMLElement>(".dossier__label"),
});

/** Below this width the pinned diagram is dropped for the static stacked layout (lines hidden). */
const DOSSIER_MIN_WIDTH = 861;

const buildTimeline = (tl: gsap.core.Timeline, el: HTMLElement) => {
  const { lines, dots, labels } = collect(el);

  // Lines reveal via BOTH opacity and stroke-dashoffset: Blink/Gecko honour the dashoffset for a
  // "draw" effect; WebKit/Safari ignores stroke-dashoffset on these non-scaling-stroke lines in a
  // preserveAspectRatio="none" viewBox (they'd render pre-drawn), so opacity is what actually hides
  // them there — degrading gracefully to a fade-in. Opacity is honoured everywhere.
  gsap.set(lines, { strokeDashoffset: 1, opacity: 0 });
  gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(labels, { opacity: 0, x: 14 });

  // Every callout reveals TOGETHER as the frame scrubs in — all lines draw, all dots pop, all
  // labels fade at once (no per-callout stagger), then hold fully-shown for the rest of the pin
  // so the specs stay readable while the frame is held. (Was a sequential i*0.5 stagger, which
  // pushed later callouts to the far end of the pin so they read as static on a normal scroll.)
  tl.to(
    lines,
    { strokeDashoffset: 0, opacity: 1, duration: 0.6, ease: "power2.inOut" },
    0,
  )
    .to(dots, { scale: 1, duration: 0.3 }, 0.15)
    .to(labels, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0.2)
    .to({}, { duration: 0.5 }); // hold the revealed state while pinned
};

/**
 * Reduced-motion reveal: NO pin, NO scrub — a gentle one-shot draw played once when the frame
 * scrolls into view, so callouts still animate in rather than appearing pre-drawn/baked. Labels
 * fade with no horizontal slide (gentler for reduced-motion). Only for the desktop dossier layout;
 * below DOSSIER_MIN_WIDTH the lines are display:none and labels stack statically, so we keep the
 * plain resting-state snap there.
 */
const revealOnEnter = (el: HTMLElement) => {
  if (window.innerWidth < DOSSIER_MIN_WIDTH) {
    gsap.set(el.querySelectorAll("[data-animate]"), {
      clearProps: "transform,opacity",
    });
    return;
  }
  const { lines, dots, labels } = collect(el);
  // opacity hides the lines everywhere (WebKit ignores stroke-dashoffset here — see buildTimeline).
  gsap.set(lines, { strokeDashoffset: 1, opacity: 0 });
  gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(labels, { opacity: 0, x: 0 });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 78%",
        toggleActions: "play none none none", // fire once on enter; no reverse/scrub
      },
    })
    .to(
      lines,
      { strokeDashoffset: 0, opacity: 1, duration: 0.5, ease: "power2.inOut" },
      0,
    )
    .to(dots, { scale: 1, duration: 0.25 }, 0.1)
    .to(labels, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.15);
};

interface FrameDossierPanelProps {
  story: FrameStory;
  callouts: FrameCallout[];
  priority?: boolean;
  refreshPriority?: number;
}

export function FrameDossierPanel({
  story,
  callouts,
  priority,
  refreshPriority = 0,
}: FrameDossierPanelProps) {
  // Every specimen shares FRAME_BOX_ASPECT (the widest frame). The flat-lays are now pre-padded to
  // that same aspect (scripts/pad-frame-specimens.mjs), so each photo fills the box and this remap
  // resolves to ~identity (fillFrac ≈ 1, barFrac ≈ 0.0002). It is kept, not deleted, so a frame
  // added later at an off aspect is still anchored correctly rather than silently skewing: a callout
  // at ax% of the PHOTO width maps to a smaller box-% span offset by the left bar. Vertical (ay/ly)
  // never needs remapping — the photo always fills the full box height.
  const photoAspect = story.image.width / story.image.height;
  const fillFrac = photoAspect / FRAME_BOX_ASPECT; // ≤ 1; photo's share of the box width
  const barFrac = (1 - fillFrac) / 2; // one side bar, as a fraction of box width
  const mapAx = (ax: number) => barFrac * 100 + ax * fillFrac;

  return (
    <ScrollSection
      id={story.id}
      className="frame-panel dossier"
      pin
      // All callouts reveal together, so the pin no longer scales with callout count — a short,
      // fixed distance draws them in right as the frame enters, then holds them (see buildTimeline).
      scrollDistance={1}
      refreshPriority={refreshPriority}
      // ≤860px the pinned leader-line diagram doesn't fit — degrade to a static stacked
      // photo + label list (matches the frames.css mobile block) instead of clipping.
      animateMinWidth={DOSSIER_MIN_WIDTH}
      onTimeline={buildTimeline}
      onReducedReveal={revealOnEnter}
    >
      <div className="dossier__header">
        <div className="dossier__eyebrow-row">
          <span className="dossier__size">{story.size}</span>
          <SectionLabel>{story.eyebrow}</SectionLabel>
        </div>
        <h2 className="dossier__title">{story.title}</h2>
        {story.hook && <p className="dossier__hook">{story.hook}</p>}
        <p className="dossier__tagline">{story.tagline}</p>
      </div>

      <div
        className="dossier__specimen"
        // Uniform box across all four frames (the widest photo's aspect) so every specimen renders
        // at an identical width AND height. Handed over as a custom property rather than
        // `aspect-ratio` directly, so the mobile rule can move the same ratio onto .dossier__plate
        // — there the photo box stays uniform while the specimen itself flows to fit the stacked
        // label list underneath it.
        style={
          { "--frame-box-aspect": String(FRAME_BOX_ASPECT) } as CSSProperties
        }
      >
        {/* Clipped media plate: a CSS gradient (see .dossier__plate) fills the box behind the
            sharp photo so narrower frames get a soft charcoal side-fill. Labels live OUTSIDE this
            plate (they overflow right), so the plate's overflow:hidden doesn't clip them. */}
        <div className="dossier__plate">
          <Image
            className="dossier__photo"
            src={story.image.src}
            width={story.image.width}
            height={story.image.height}
            alt={story.image.alt}
            priority={priority}
            sizes="(min-width: 769px) 40vw, 88vw"
          />
        </div>

        {/* Leader lines — non-scaling stroke so the stretched viewBox doesn't distort them. */}
        <svg
          className="dossier__lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {callouts.map((c, i) => (
            <line
              key={`line-${i}`}
              className="dossier__line"
              x1={mapAx(c.ax)}
              y1={c.ay}
              x2={100}
              y2={c.ly}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {callouts.map((c, i) => (
          <span
            key={`dot-${i}`}
            className="dossier__dot"
            style={{ left: `${mapAx(c.ax)}%`, top: `${c.ay}%` }}
            aria-hidden="true"
          />
        ))}

        <ul className="dossier__labels">
          {callouts.map((c, i) => (
            <li
              key={`label-${i}`}
              className="dossier__label"
              data-animate
              style={{ top: `${c.ly}%` }}
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </ScrollSection>
  );
}
