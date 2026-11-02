"use client";

import { useEffect } from "react";
import { warmStoreDataAndImages, shouldSkipWarming } from "@/store/services/storeWarming";

/**
 * Intelligent Store Background Warmer
 *
 * Runs strictly after the homepage is interactive and the browser is idle.
 * Speculatively warms product catalog data and primary product images
 * so subsequent navigation to /store is near-instantaneous.
 *
 * Automatically pauses/cancels on slow networks, Data Saver, tab hide, or unmount.
 */
export function StoreBackgroundWarmer() {
  useEffect(() => {
    if (shouldSkipWarming()) {
      return;
    }

    const abortController = new AbortController();
    let idleId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const executeWarming = () => {
      if (shouldSkipWarming() || abortController.signal.aborted) {
        return;
      }

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
          () => {
            warmStoreDataAndImages({ signal: abortController.signal });
          },
          { timeout: 3500 }
        );
      } else {
        timeoutId = setTimeout(() => {
          warmStoreDataAndImages({ signal: abortController.signal });
        }, 2000);
      }
    };

    // Ensure critical initial assets and hero rendering finish before scheduling background warming
    if (document.readyState === "complete") {
      executeWarming();
    } else {
      const handleLoad = () => {
        window.removeEventListener("load", handleLoad);
        executeWarming();
      };
      window.addEventListener("load", handleLoad);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        abortController.abort();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      abortController.abort();
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

