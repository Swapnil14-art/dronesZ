"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { withMotionPreference } from "@/lib/motion";
import { FrameSequenceCanvas } from "@/components/scroll/FrameSequenceCanvas";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CUSTOM_AIRFRAMES } from "@/data/frames";
import "./frames.css";

/**
 * Custom Airframes — the conversion moment. Two parts:
 *  1. A pinned reveal that scroll-scrubs the custom-showcase clip (a red CAD wireframe
 *     materializing into a finished carbon frame): scroll = "your design becomes hardware".
 *  2. The two-path fork ("I have a design" / "I have an idea") + CTA into the (parked) form.
 * The clip is a frame sequence scrubbed on a canvas (same technique as the hero); reduced-motion
 * parks it on the finished frame. The real two-path upload form drops into the `form` slot later.
 */
const CUSTOM_SEQ_COUNT = 100;

function CustomRevealPanel() {
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const drawRef = useRef<(() => void) | null>(null);
  // Below the fold — don't preload the 100-frame sequence until the section nears the
  // viewport, so it doesn't compete with the hero's own preload at initial page load.
  const [near, setNear] = useState(false);

  const handleReady = useCallback((draw: () => void) => {
    drawRef.current = draw;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      withMotionPreference(
        {
          animated: () => {
            const proxy = { t: 0 };
            gsap.to(proxy, {
              t: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top top",
                end: "+=140%",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                refreshPriority: 50, // below thirteen-inch (60); keeps stacked pins ordered
                invalidateOnRefresh: true,
              },
              onUpdate: () => {
                progressRef.current = proxy.t;
                drawRef.current?.();
              },
            });
          },
          reduced: () => {
            progressRef.current = 1; // show the finished frame, no pin
            drawRef.current?.();
          },
        },
        el,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="custom-reveal" aria-labelledby="custom-title">
      <div className="custom-reveal__copy">
        <SectionLabel>{CUSTOM_AIRFRAMES.eyebrow}</SectionLabel>
        <h2 id="custom-title" className="custom-reveal__title">
          {CUSTOM_AIRFRAMES.title}
        </h2>
        <p className="custom-reveal__lead">
          Whether you arrive with a finished CAD design or only an idea on
          paper, our engineering team turns it into a production-ready airframe.
        </p>
      </div>

      <div className="custom-reveal__media">
        <img
          className="custom-reveal__poster"
          src={`/custom-seq/${String(CUSTOM_SEQ_COUNT).padStart(3, "0")}.webp`}
          alt="A bespoke DronesZ airframe rendered from CAD into a finished carbon-and-red frame."
          loading="lazy"
        />
        {near && (
          <FrameSequenceCanvas
            dir="/custom-seq"
            count={CUSTOM_SEQ_COUNT}
            progressRef={progressRef}
            onReady={handleReady}
            className="custom-reveal__canvas"
          />
        )}
        {/* Names the panel for what it is. Reuses the SectionLabel eyebrow so it matches every
            other section marker on the page; the wrapper only positions it and flips it to
            light ink for the dark plate underneath. */}
        <div className="custom-reveal__caption">
          <SectionLabel>Customisation Panel</SectionLabel>
        </div>
      </div>
    </section>
  );
}

/**
 * How an idea becomes hardware — a "you define, we build" rail (reworded 2026-08-13 from the
 * original "design it, validate it, manufacture it, bring it to life" verb checklist).
 *
 * Sits between the pinned reveal and the two-path fork, and earns its keep twice: it fills the
 * ~400px of dead canvas that used to sit above the tagline (the pinned panel centres a 424px
 * plate in 100vh, then the fork added a full --space-section on top), and it bridges the section
 * narratively — here is the panel, here is how we get you one, now pick your path.
 *
 * This is also where the nav's "Custom" anchor lands (`id="custom-airframes"`) — a click should
 * open on the explanation of how a build works, not skip straight to the tagline/path-card fork.
 *
 * Static by design. This section already spends its motion budget on the pinned scrub above;
 * a second animated element competing with it read as busy.
 */
function CustomProcess() {
  // Named rather than indexed — narrative[] is the client's full text of record, and only the
  // closing line is surfaced here. The other beats stay unrendered for now.
  const kicker = CUSTOM_AIRFRAMES.narrative.at(-1);

  return (
    <section
      className="custom-process"
      id="custom-airframes"
      aria-label="How a custom build works"
    >
      <ol className="custom-process__rail">
        {CUSTOM_AIRFRAMES.process.map((step, i) => (
          <li className="process-step" key={step}>
            <span className="process-step__num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="process-step__label">{step}</span>
          </li>
        ))}
      </ol>
      {kicker && <p className="custom-process__kicker">{kicker}</p>}
    </section>
  );
}

const PATHS = [
  {
    tag: "Option A",
    title: "I have a design",
    body: "CAD or STEP files ready to go. We validate them, optimize for manufacturability, and build.",
    href: "/contact?path=design",
    cta: "Upload your design →",
  },
  {
    tag: "Option B",
    title: "I have an idea",
    body: "Just a mission and a sketch. Our team engineers it from requirements to a finished airframe.",
    href: "/contact?path=idea",
    cta: "Share your idea →",
  },
];

/**
 * The two-path fork — the conversion moment ("Your Mission. Our Engineering." + the two paths).
 * The nav's "Custom" anchor targets `CustomProcess` above, not this panel; this one is reached by
 * scrolling past it, same as any other section.
 */
function CustomFork({ form }: { form?: ReactNode }) {
  return (
    <section className="custom-fork" aria-label="Start a custom build">
      <p className="custom-fork__tagline">{CUSTOM_AIRFRAMES.tagline}</p>
      <div className="custom-fork__paths">
        {PATHS.map((p) => (
          <a className="path-card" key={p.title} href={p.href}>
            <span className="path-card__tag">{p.tag}</span>
            <h3 className="path-card__title">{p.title}</h3>
            <p className="path-card__body">{p.body}</p>
            <span className="path-card__cta">{p.cta}</span>
          </a>
        ))}
      </div>
      {/* Fills the gap that used to run straight into "GET IN TOUCH" below — the range of
          platforms the client builds, as a quiet tag row rather than another block of prose. */}
      <ul className="custom-fork__types" aria-label="Frame types we build">
        {CUSTOM_AIRFRAMES.frameTypes.map((type) => (
          <li className="type-tag" key={type}>
            {type}
          </li>
        ))}
      </ul>
      {form && <div className="custom-fork__form">{form}</div>}
    </section>
  );
}

export function CustomAirframesSection({ form }: { form?: ReactNode }) {
  return (
    <div>
      <CustomRevealPanel />
      <CustomProcess />
      <CustomFork form={form} />
    </div>
  );
}
