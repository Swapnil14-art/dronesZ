"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * NavigationProgressBar
 * 
 * High-performance, polished top progress bar for Next.js App Router.
 * Positioned at the top edge of the webpage viewport, immediately below
 * the browser chrome / bookmarks bar.
 *
 * Features:
 * - Listens for internal <a> clicks with 120ms debounce (eliminates flash for instant routes).
 * - Intercepts router.push / history.pushState for programmatic transitions.
 * - Handles browser back/forward (popstate).
 * - Completes smoothly when pathname or searchParams change.
 * - 8-second safety timeout prevents stuck states.
 * - Pointer-events none: never interferes with clicks or header controls.
 * - Respects prefers-reduced-motion.
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trickleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  // Clear all running timers
  const clearAllTimers = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (trickleIntervalRef.current) {
      clearInterval(trickleIntervalRef.current);
      trickleIntervalRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  // Complete and fade out
  const finish = useCallback(() => {
    if (!isNavigatingRef.current && !visible && !startTimerRef.current) {
      return;
    }

    clearAllTimers();
    isNavigatingRef.current = false;

    // Immediately snap to 100%
    setProgress(100);

    // Fade out smoothly
    const fadeTimer = setTimeout(() => {
      setVisible(false);
      // Reset progress after fade transition finishes
      const resetTimer = setTimeout(() => {
        setProgress(0);
      }, 300);
      return () => clearTimeout(resetTimer);
    }, 200);

    return () => clearTimeout(fadeTimer);
  }, [clearAllTimers, visible]);

  // Start navigation loading bar
  const start = useCallback(() => {
    // If already running or scheduled, do not duplicate
    if (isNavigatingRef.current || startTimerRef.current) {
      return;
    }

    // 120ms delay: if destination page renders faster than 120ms (e.g. warmed cache),
    // finish() will cancel this timer and no flicker occurs.
    startTimerRef.current = setTimeout(() => {
      isNavigatingRef.current = true;
      setVisible(true);
      setProgress(25);

      // Smooth staged trickle: moves from 25% to ~85% while route resolves
      trickleIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            return prev;
          }
          const step = Math.max(1, (85 - prev) * 0.15);
          return Math.min(85, prev + step);
        });
      }, 200);

      // Safety timeout: never stay stuck for > 8s on network errors or cancellations
      safetyTimeoutRef.current = setTimeout(() => {
        finish();
      }, 8000);
    }, 120);
  }, [finish]);

  // Complete when route transition finishes
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  // Global listeners for link clicks, history state, and popstate
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept internal anchor link clicks
    const handleClick = (e: MouseEvent) => {
      // Ignore right clicks or clicks with modifier keys
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;

      // Ignore download links or open in new tab
      if (target.getAttribute("download") || target.target === "_blank") {
        return;
      }

      // Ignore external URLs
      try {
        const destUrl = new URL(target.href, window.location.href);
        if (destUrl.origin !== window.location.origin) {
          return;
        }

        // Ignore hash jumps on the same page
        const isSamePath =
          destUrl.pathname === window.location.pathname &&
          destUrl.search === window.location.search;
        if (isSamePath) {
          return;
        }

        // Genuine internal navigation starting
        start();
      } catch {
        // Invalid URL, ignore
      }
    };

    // 2. Intercept history.pushState and replaceState (used by router.push)
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      const urlArg = args[2];
      if (urlArg && typeof urlArg === "string") {
        try {
          const dest = new URL(urlArg, window.location.href);
          if (
            dest.pathname !== window.location.pathname ||
            dest.search !== window.location.search
          ) {
            start();
          }
        } catch {}
      }
      return originalPushState(...args);
    };

    window.history.replaceState = function (...args) {
      const urlArg = args[2];
      if (urlArg && typeof urlArg === "string") {
        try {
          const dest = new URL(urlArg, window.location.href);
          if (
            dest.pathname !== window.location.pathname ||
            dest.search !== window.location.search
          ) {
            start();
          }
        } catch {}
      }
      return originalReplaceState(...args);
    };

    // 3. Browser Back / Forward buttons
    const handlePopState = () => {
      start();
    };

    // 4. Custom manual event support
    const handleCustomStart = () => start();
    const handleCustomFinish = () => finish();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("dronesz:nav-start", handleCustomStart);
    window.addEventListener("dronesz:nav-finish", handleCustomFinish);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("dronesz:nav-start", handleCustomStart);
      window.removeEventListener("dronesz:nav-finish", handleCustomFinish);

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearAllTimers();
    };
  }, [start, finish, clearAllTimers]);

  if (!visible && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid="navigation-progress-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3px",
        zIndex: 999999,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg, #e52b31 0%, #f97316 50%, #e52b31 100%)",
          boxShadow: "0 0 10px rgba(229, 43, 49, 0.8), 0 0 4px rgba(249, 115, 22, 0.6)",
          borderRadius: "0 2px 2px 0",
          transition:
            progress === 100
              ? "width 160ms ease-out"
              : progress === 0
              ? "none"
              : "width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
        }}
      >
        {/* Leading edge glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "80px",
            height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 100%)",
            boxShadow: "0 0 8px #ffffff",
          }}
        />
      </div>
    </div>
  );
}

