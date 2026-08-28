"use client";

/**
 * LenisGSAPProvider — the single source of truth for scroll + animation timing.
 *
 * Critical bridge (see docs/research.md §3): Lenis runs with autoRaf:false and is driven
 * from GSAP's ticker, so smooth-scroll and ScrollTrigger share ONE rAF loop. Without this
 * the two desync and scrubbed timelines stutter. lagSmoothing(0) keeps scrub frame-accurate.
 *
 * Exposes scrollTo via context so in-page anchors (the "Frames" nav button) go through
 * Lenis instead of native scroll, which Lenis hijacks.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollTarget = string | number | HTMLElement;
interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
}

interface LenisContextValue {
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
}

const LenisContext = createContext<LenisContextValue | null>(null);

export function useLenisScroll(): LenisContextValue {
  const ctx = useContext(LenisContext);
  if (!ctx) {
    throw new Error("useLenisScroll must be used within <LenisGSAPProvider>");
  }
  return ctx;
}

export function LenisGSAPProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      // GSAP ticker delivers seconds; Lenis.raf expects milliseconds.
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // ReactLenis populates lenisRef.current.lenis on its own effect, which may not be ready
    // on this first frame. Poll until it exists, then bind ScrollTrigger.update for accurate
    // scrub sync and expose the instance for E2E/visual tests.
    let rafId = 0;
    let unbind: (() => void) | undefined;
    const bind = () => {
      const instance = lenisRef.current?.lenis;
      if (!instance) {
        rafId = requestAnimationFrame(bind);
        return;
      }
      instance.on("scroll", ScrollTrigger.update);
      (window as unknown as { lenis: unknown }).lenis = instance;
      unbind = () => instance.off("scroll", ScrollTrigger.update);
    };
    bind();

    // This effect runs AFTER all child ScrollSections have created their pinned triggers
    // (effects fire child-first). A single refresh here re-sorts every trigger and recomputes
    // start/end accounting for all pin-spacers — without it, pins created before earlier
    // pin-spacers existed engage at stale scroll positions and overlap. Re-run once fonts swap
    // (Space Grotesk changes heights) and on full load.
    const refresh = () => ScrollTrigger.refresh();
    const refreshRaf = requestAnimationFrame(refresh);
    let fontsCancelled = false;
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        if (!fontsCancelled) refresh();
      });
    }
    window.addEventListener("load", refresh);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(refreshRaf);
      fontsCancelled = true;
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(update);
      unbind?.();
    };
  }, []);

  const scrollTo = useCallback(
    (target: ScrollTarget, options?: ScrollToOptions) => {
      lenisRef.current?.lenis?.scrollTo(target, options);
    },
    [],
  );

  return (
    // NOTE: no `motion` MotionConfig here — the whole app avoids the `motion` package to keep
    // it out of the initial JS chunk (<150kB budget). Reveal animations use CSS + observers
    // (AnimatedText) and reduced-motion is gated per-timeline via lib/motion withMotionPreference.
    // Do NOT reintroduce `motion/react` without re-checking the `/` bundle budget.
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      <LenisContext.Provider value={{ scrollTo }}>
        {children}
      </LenisContext.Provider>
    </ReactLenis>
  );
}
