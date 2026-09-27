"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion";
import { FrameSequenceCanvas } from "@/components/scroll/FrameSequenceCanvas";
import "./hero.css";

const HERO_FRAME_COUNT = 120;
const PLAYBACK_DURATION_MS = 3800; // ~32 fps across 120 frames

/**
 * HeroSection: Plays /hero-seq/ frame-by-frame automatically on page load.
 * While playing, hero text is hidden.
 * When the animation reaches its final frame, the final frame is held permanently
 * and the hero copy smoothly fades into view.
 *
 * Robust lifecycle:
 * - Initializes immediately on mount.
 * - Starts preloading frames with critical first frames prioritized.
 * - Resets to frame 0 and restarts animation smoothly on every home entry (brand click, nav link, bfcache pageshow, popstate).
 * - Reduced motion skips playback and displays the assembled drone immediately.
 */
export function HeroSection() {
  const pathname = usePathname();
  const progressRef = useRef(0);
  const drawRef = useRef<((force?: boolean) => void) | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const [isEnded, setIsEnded] = useState(false);

  const stopPlayback = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPlayingRef.current = false;
    startTimeRef.current = null;
  }, []);

  const startPlayback = useCallback(() => {
    stopPlayback();

    // Reduced motion users skip the animation and see the final hero state immediately
    if (prefersReducedMotion()) {
      progressRef.current = 1;
      drawRef.current?.(true);
      setIsEnded(true);
      return;
    }

    setIsEnded(false);
    progressRef.current = 0;
    drawRef.current?.(true);

    isPlayingRef.current = true;
    startTimeRef.current = performance.now();

    const step = (timestamp: number) => {
      if (!isPlayingRef.current) return;
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / PLAYBACK_DURATION_MS, 1);

      progressRef.current = progress;
      drawRef.current?.();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        progressRef.current = 1;
        drawRef.current?.(true);
        setIsEnded(true);
        isPlayingRef.current = false;
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [stopPlayback]);

  const handleReady = useCallback(
    (draw: (force?: boolean) => void) => {
      drawRef.current = draw;
      draw(true);
      if (!isPlayingRef.current && !isEnded) {
        startPlayback();
      }
    },
    [isEnded, startPlayback],
  );

  // Initial mount trigger
  useEffect(() => {
    startPlayback();
    return () => {
      stopPlayback();
    };
  }, [startPlayback, stopPlayback]);

  // Route transition trigger (Next.js pathname)
  useEffect(() => {
    if (pathname === "/") {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [pathname, startPlayback, stopPlayback]);

  // Handle browser back/swipe navigation, bfcache restore, tab visibility, and custom header clicks
  useEffect(() => {
    const handleHomeEntry = () => {
      if (pathname === "/" || (typeof window !== "undefined" && window.location.pathname === "/")) {
        startPlayback();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (pathname === "/" || (typeof window !== "undefined" && window.location.pathname === "/"))
      ) {
        if (!isEnded && !isPlayingRef.current) {
          startPlayback();
        }
      }
    };

    window.addEventListener("pageshow", handleHomeEntry);
    window.addEventListener("popstate", handleHomeEntry);
    window.addEventListener("dronesz:home-entry", handleHomeEntry);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleHomeEntry);
      window.removeEventListener("popstate", handleHomeEntry);
      window.removeEventListener("dronesz:home-entry", handleHomeEntry);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPlayback();
    };
  }, [pathname, isEnded, startPlayback, stopPlayback]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Full-bleed frame sequence canvas behind everything */}
      <div className="hero-media">
        {/* Poster fallback (no-JS / instant paint before first frame): the initial frame */}
        <img
          className="hero-poster"
          src="/hero-seq/001.png"
          alt="A DronesZ 5-inch FPV drone in a matte studio void with red rim light."
          width={1280}
          height={560}
          fetchPriority="high"
        />
        <FrameSequenceCanvas
          dir="/hero-seq"
          count={HERO_FRAME_COUNT}
          ext="png"
          progressRef={progressRef}
          onReady={handleReady}
          className="hero-canvas"
        />
      </div>

      <div className="hero-scrim" aria-hidden="true" />

      <div className={`hero-copy ${isEnded ? "is-visible" : ""}`}>
        <p className="hero-eyebrow">DronesZ India</p>
        <h1 id="hero-title" className="hero-title">
          Redefining Flight.{" "}
          <span className="accent">Assembling the Future.</span>
        </h1>
        <p className="hero-sub">
          Custom airframes, propulsion systems, and flight-ready platforms —
          engineered in Indore, assembled for the mission.
        </p>
      </div>
    </section>
  );
}


