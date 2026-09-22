"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import "./hero.css";

/**
 * HeroSection: Plays /hero-seq/FINAL.mp4 once automatically on page load (muted).
 * While playing, hero text is hidden and the scroll indicator is omitted.
 * When the video reaches its final frame, the final frame is held permanently
 * and the hero copy smoothly fades into view.
 *
 * Scrolling does not scrub or pause the video.
 * Reduced motion users skip the cinematic playback and see the final hero state immediately.
 */
export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  const handleEnded = useCallback(() => {
    setIsEnded(true);
  }, []);

  useEffect(() => {
    setMounted(true);

    // If user prefers reduced motion, immediately show text
    if (prefersReducedMotion()) {
      setIsEnded(true);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If autoplay fails for any browser policy reason, reveal text gracefully
          setIsEnded(true);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && prefersReducedMotion() && videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.duration) {
        videoRef.current.currentTime = videoRef.current.duration;
      }
    }
  }, [mounted]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Full-bleed video footage behind everything */}
      <div className="hero-media">
        {mounted && (
          <video
            ref={videoRef}
            className="hero-video"
            src="/hero-seq/FINAL.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            onError={() => setIsEnded(true)}
          />
        )}
      </div>

      <div className="hero-scrim" aria-hidden="true" />

      <div className={`hero-copy ${isEnded ? "is-visible" : ""}`}>
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
    </section>
  );
}


