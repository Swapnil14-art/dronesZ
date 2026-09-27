"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Scroll-scrubbed frame-sequence canvas (Apple-style): draws the pre-extracted WebP frame that
 * matches a scroll-progress ref (0→1) onto a cover-fit <canvas>.
 *
 * Robust startup & preloading features:
 * 1. Immediate, non-blocking preloading starts on mount without waiting for scroll.
 * 2. Critical priority tier preloads initial frames (001-005) & resting frame first.
 * 3. Progressive keyframe stride fills intermediate milestones across the timeline.
 * 4. Resilient nearest-frame fallback guarantees a smooth frame is always drawn, never blank or broken.
 * 5. Automatic retry with exponential backoff on transient network failures.
 * 6. Responsive ResizeObserver with device pixel ratio scaling.
 * 7. Comprehensive resource and event cleanup on component unmount.
 */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function FrameSequenceCanvas({
  dir,
  count,
  ext = "webp",
  progressRef,
  onReady,
  className = "frame-seq-canvas",
}: {
  /** Public dir of the sequence, e.g. "/custom-seq" (frames named 001.webp…). */
  dir: string;
  count: number;
  ext?: string;
  progressRef: MutableRefObject<number>;
  /** Hands draw() up so the owner can request a repaint each scroll tick or frame step. */
  onReady?: (draw: (force?: boolean) => void) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let isUnmounted = false;
    let animFrameId: number | null = null;
    const activeTimeouts: number[] = [];

    // Array of HTMLImageElement objects
    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    // Loaded status boolean map
    const loadedFrames: boolean[] = new Array(count).fill(false);
    // Retry count tracking
    const retryCounts: number[] = new Array(count).fill(0);

    let lastDrawnIndex = -1;

    // Helper: Find the nearest loaded frame to the target index so canvas is never blank
    const findBestFrameIndex = (targetIdx: number): number => {
      if (loadedFrames[targetIdx] && frames[targetIdx]?.naturalWidth) {
        return targetIdx;
      }

      for (let offset = 1; offset < count; offset++) {
        const prev = targetIdx - offset;
        if (prev >= 0 && loadedFrames[prev] && frames[prev]?.naturalWidth) {
          return prev;
        }

        const next = targetIdx + offset;
        if (next < count && loadedFrames[next] && frames[next]?.naturalWidth) {
          return next;
        }
      }
      return -1;
    };

    const draw = (force = false) => {
      if (isUnmounted || !canvas || !ctx) return;

      const targetIdx = Math.round(clamp01(progressRef.current) * (count - 1));
      const bestIdx = findBestFrameIndex(targetIdx);

      if (bestIdx < 0) return;
      if (!force && bestIdx === lastDrawnIndex && canvas.width > 0 && canvas.height > 0) return;

      const img = frames[bestIdx];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      lastDrawnIndex = bestIdx;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) return;

      const ir = img.naturalWidth / img.naturalHeight;
      let dw = cw;
      let dh = cw / ir;
      if (dh < ch) {
        dh = ch;
        dw = ch * ir;
      }

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const requestRedraw = (force = false) => {
      if (animFrameId !== null && !force) return;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      animFrameId = requestAnimationFrame(() => {
        animFrameId = null;
        draw(force);
      });
    };

    const resize = () => {
      if (isUnmounted || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const newWidth = Math.round(rect.width * dpr);
      const newHeight = Math.round(rect.height * dpr);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        lastDrawnIndex = -1;
        draw();
      }
    };

    // Load an individual frame with retry handling
    const loadFrame = (index: number) => {
      if (isUnmounted || index < 0 || index >= count) return;
      if (frames[index] && loadedFrames[index]) return;

      const img = new Image();
      const frameNum = String(index + 1).padStart(3, "0");
      img.src = `${dir}/${frameNum}.${ext}`;

      img.onload = () => {
        if (isUnmounted) return;
        loadedFrames[index] = true;
        const currentTarget = Math.round(clamp01(progressRef.current) * (count - 1));
        if (index === currentTarget || lastDrawnIndex === -1 || Math.abs(index - currentTarget) <= 2) {
          requestRedraw();
        }
      };

      img.onerror = () => {
        if (isUnmounted) return;
        if (retryCounts[index] < 2) {
          retryCounts[index]++;
          const timerId = window.setTimeout(() => {
            if (!isUnmounted) {
              loadFrame(index);
            }
          }, 350 * retryCounts[index]);
          activeTimeouts.push(timerId);
        }
      };

      frames[index] = img;

      if (img.complete && img.naturalWidth > 0) {
        loadedFrames[index] = true;
      }
    };

    // --- Tiered Non-Blocking Preloader ---
    // 1. Critical Priority: Immediate load for first frames and resting frame
    const criticalIndices = [0, 1, 2, 3, 4, count - 1].filter(
      (idx, pos, arr) => idx < count && arr.indexOf(idx) === pos,
    );
    for (const idx of criticalIndices) {
      loadFrame(idx);
    }

    // 2. Keyframes / Stride: Every 5th frame across the timeline
    const strideIndices: number[] = [];
    for (let i = 5; i < count - 1; i += 5) {
      if (!criticalIndices.includes(i)) {
        strideIndices.push(i);
      }
    }

    // 3. Remaining in-between frames
    const remainingIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      if (!criticalIndices.includes(i) && !strideIndices.includes(i)) {
        remainingIndices.push(i);
      }
    }

    // Stream non-critical frames in small batches during browser idle time
    const queue = [...strideIndices, ...remainingIndices];
    let queueIdx = 0;
    const CHUNK_SIZE = 4;

    const scheduleNextChunk = () => {
      if (isUnmounted || queueIdx >= queue.length) return;

      const schedule = typeof window.requestIdleCallback === "function"
        ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 200 })
        : (cb: () => void) => window.setTimeout(cb, 16);

      const handle = schedule(() => {
        if (isUnmounted) return;
        const end = Math.min(queueIdx + CHUNK_SIZE, queue.length);
        for (let i = queueIdx; i < end; i++) {
          loadFrame(queue[i]);
        }
        queueIdx = end;
        if (queueIdx < queue.length) {
          scheduleNextChunk();
        }
      });

      if (typeof handle === "number") {
        activeTimeouts.push(handle);
      }
    };

    const initialTimer = window.setTimeout(scheduleNextChunk, 40);
    activeTimeouts.push(initialTimer);

    onReadyRef.current?.(draw);
    resize();
    requestRedraw();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(canvas);
    }

    window.addEventListener("resize", resize, { passive: true });

    return () => {
      isUnmounted = true;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      for (const t of activeTimeouts) {
        clearTimeout(t);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", resize);

      for (const img of frames) {
        if (img) {
          img.onload = null;
          img.onerror = null;
          img.src = "";
        }
      }
    };
  }, [dir, count, ext, progressRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
