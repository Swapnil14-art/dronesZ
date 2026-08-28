"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Scroll-scrubbed frame-sequence canvas (Apple-style): draws the pre-extracted WebP frame that
 * matches a scroll-progress ref (0→1) onto a cover-fit <canvas>. Seeks instantly with no codec
 * jank, iOS-safe. Generic over the sequence directory + frame count so the hero and the custom
 * "wireframe → hardware" reveal share one implementation.
 */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function FrameSequenceCanvas({
  dir,
  count,
  progressRef,
  onReady,
  className = "frame-seq-canvas",
}: {
  /** Public dir of the sequence, e.g. "/custom-seq" (frames named 001.webp…). */
  dir: string;
  count: number;
  progressRef: MutableRefObject<number>;
  /** Hands draw() up so the owner can request a repaint each scroll tick. */
  onReady: (draw: () => void) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const frames: HTMLImageElement[] = [];
    let lastDrawn = -1;

    const draw = () => {
      const idx = Math.round(clamp01(progressRef.current) * (count - 1));
      if (idx === lastDrawn) return;
      const img = frames[idx];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      lastDrawn = idx;

      const cw = canvas.width;
      const ch = canvas.height;
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastDrawn = -1;
      draw();
    };

    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = `${dir}/${String(i + 1).padStart(3, "0")}.webp`;
      img.onload = draw;
      frames[i] = img;
    }

    onReady(draw);
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      // Drop in-flight loads + decoded bitmaps if we unmount before all frames arrive.
      for (const img of frames) {
        img.onload = null;
        img.src = "";
      }
    };
  }, [dir, count, progressRef, onReady]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
