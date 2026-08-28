/**
 * Google Flow (Veo 3.1) prompts for the 5 Frames-spine clips — 4 pre-built frames + the custom
 * showcase. Reuses SHARED_BRAND_PROMPT so the whole library reads as one brand film.
 *
 * PRODUCTION NOTE: generate these image-to-video in Flow ("Frames to Video" / Ingredients) using
 * the matching /frames/{size}.PNG flat-lay as the STARTING FRAME — this keeps it the real DronesZ
 * airframe instead of a generic Veo drone. 16:9 landscape, 8s, subtle continuous motion for a
 * seamless site loop. Veo audio is unused (site plays its own soundtrack; clips render muted).
 *
 * When a clip is produced, drop its path onto the matching FRAME_STORIES entry (add a `video`
 * slot) — the pinned panel component swaps from photo to clip with no code change.
 */

import { SHARED_BRAND_PROMPT } from "./veo-prompts";

export interface VeoFramePrompt {
  /** Matches FRAME_STORIES id (or "custom-showcase"); pipeline writes /video/frames/{id}.mp4+.webm. */
  frameId: string;
  /** Source flat-lay to seed image-to-video in Flow. */
  seedImage: string;
  /** Frame-specific motion beat, appended to SHARED_BRAND_PROMPT. */
  scene: string;
}

export const VEO_FRAME_PROMPTS: VeoFramePrompt[] = [
  {
    frameId: "five-inch",
    seedImage: "/frames/5.webp",
    scene:
      "Slow macro push across the matte-black surface as the scattered modular components of a " +
      "5-inch FPV airframe — carbon-fiber arms and red 3D-printed motor guards — glide inward and " +
      "assemble into a complete quad frame; one arm then detaches and swaps back cleanly to show " +
      "field repair. Red rim light traces every carbon edge. Theme: repair what breaks, first flight.",
  },
  {
    frameId: "seven-inch",
    seedImage: "/frames/7.webp",
    scene:
      "A 7-inch long-range airframe holds center in the void as the camera drifts slowly back to " +
      "reveal its long carbon arms; faint haze streams past like distance and altitude, red rim " +
      "light steady along the frame. Theme: calm endurance, reaching places others can't.",
  },
  {
    frameId: "ten-inch",
    seedImage: "/frames/10.webp",
    scene:
      "A 10-inch heavy-lift airframe rotates slowly as modular payload plates and sensor mounts " +
      "lower into place one by one — a thermal pod, a LiDAR puck — the red accent light pulsing at " +
      "each mount point. Theme: payload defines capability, purpose loaded onto the platform.",
  },
  {
    frameId: "thirteen-inch",
    seedImage: "/frames/13.webp",
    scene:
      "A commanding hero reveal of the 13-inch flagship airframe emerging from darkness, reinforced " +
      "composite geometry catching a hard key light with deep red rim; the camera arcs around its " +
      "largest structure with weight and gravity. Theme: failure isn't an option, mission-critical.",
  },
  {
    frameId: "custom-showcase",
    // No single seed frame — start from a CAD-wireframe still or run text-to-video.
    seedImage: "",
    scene:
      "A glowing red CAD wireframe of a bespoke UAV airframe rotates in the void, then materializes " +
      "surface by surface into a finished carbon-and-red physical frame — engineering becoming " +
      "hardware. Theme: designed around your mission, one-of-a-kind, no shelf limits.",
  },
];

/** Full prompt string for a clip = shared brand template + the frame scene. */
export function buildVeoFramePrompt(p: VeoFramePrompt): string {
  return `${SHARED_BRAND_PROMPT} ${p.scene}`;
}
