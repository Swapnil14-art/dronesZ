"use client";

import { useEffect, useRef, useState } from "react";
import "./audio.css";

/**
 * Floating cinematic-soundtrack toggle. Muted by default (browser autoplay policy +
 * courtesy); the first click is the user gesture that unlocks playback, then it loops.
 * Volume fades in/out so it never slams on. The <audio> uses preload="none" so the 2.3MB
 * file is only fetched once the visitor opts in. Reduced-motion only stills the equalizer
 * bars — the control itself always works.
 */
const TARGET_VOLUME = 0.55;
const FADE_STEP = 0.05;
const FADE_MS = 60;

export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [playing, setPlaying] = useState(false);

  // Clean up any in-flight fade on unmount.
  useEffect(() => () => clearInterval(fadeRef.current), []);

  const fadeTo = (target: number, onDone?: () => void) => {
    const el = audioRef.current;
    if (!el) return;
    clearInterval(fadeRef.current);
    fadeRef.current = setInterval(() => {
      const next =
        target > el.volume
          ? Math.min(target, el.volume + FADE_STEP)
          : Math.max(target, el.volume - FADE_STEP);
      el.volume = next;
      if (next === target) {
        clearInterval(fadeRef.current);
        onDone?.();
      }
    }, FADE_MS);
  };

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      fadeTo(0, () => el.pause());
      setPlaying(false);
      return;
    }
    try {
      el.volume = 0;
      await el.play();
      setPlaying(true);
      fadeTo(TARGET_VOLUME);
    } catch {
      // Play blocked (rare on a direct click) — stay in the off state silently.
      setPlaying(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="sound-toggle"
        data-playing={playing || undefined}
        aria-pressed={playing}
        aria-label={playing ? "Mute soundtrack" : "Play soundtrack"}
        onClick={toggle}
      >
        <span className="sound-toggle__bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="sound-toggle__label">
          {playing ? "Sound on" : "Sound"}
        </span>
      </button>
      <audio ref={audioRef} src="/audio/soundtrack.mp3" loop preload="none" />
    </>
  );
}
