"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { withMotionPreference } from "@/lib/motion";
import { FrameSequenceCanvas } from "@/components/scroll/FrameSequenceCanvas";
import "./hero.css";

/**
 * Hero: the real drone assembles as you scroll. A pinned ScrollTrigger scrubs a progress ref
 * (0→1) that HeroSequence maps onto a frame sequence — scroll is the playhead. Replaces the old
 * R3F box-quadcopter (three.js gone from the app entirely). Reduced-motion parks progress at 1
 * so the assembled frame shows statically with no pin; a poster <img> covers no-JS.
 */
export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const drawRef = useRef<(() => void) | null>(null);

  const handleReady = useCallback((draw: () => void) => {
    drawRef.current = draw;
  }, []);

  useGSAP(
    () => {
      const el = heroRef.current;
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
                end: "+=130%",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                // Top of the page → highest refresh priority so its pin-spacer is measured
                // before the frame pins compute their start (stacked-pin overlap fix).
                refreshPriority: 100,
                invalidateOnRefresh: true,
              },
              onUpdate: () => {
                progressRef.current = proxy.t;
                drawRef.current?.();
              },
            });
          },
          reduced: () => {
            progressRef.current = 1;
            drawRef.current?.();
          },
        },
        el,
      );
    },
    { scope: heroRef },
  );

  return (
    <section className="hero" ref={heroRef} aria-labelledby="hero-title">
      {/* Full-bleed assembling-drone footage behind everything. */}
      <div className="hero-media">
        {/* Poster fallback (no-JS / canvas failure): the assembled last frame. */}
        <img
          className="hero-poster"
          src="/hero-seq/100.webp"
          alt="A DronesZ 5-inch FPV drone, fully assembled in a matte studio void with red rim light."
          width={1280}
          height={560}
          fetchPriority="high"
        />
        <FrameSequenceCanvas
          dir="/hero-seq"
          count={100}
          progressRef={progressRef}
          onReady={handleReady}
          className="hero-canvas"
        />
      </div>

      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-copy">
        <p className="hero-eyebrow">DronesZ India</p>
        <h1 id="hero-title" className="hero-title">
          Redefining Flight.{" "}
          <span className="accent">Assembling the Future.</span>
        </h1>
        <p className="hero-sub">
          Custom airframes, counter-UAS systems, and flight-ready platforms —
          engineered in Indore, assembled for the mission.
        </p>
      </div>

      <div className="hero-cue">Scroll</div>
    </section>
  );
}
