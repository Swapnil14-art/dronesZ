/**
 * Transcode the raw Google Flow (Veo) frame clips into web-optimized, MUTED
 * MP4 (H.264) + WebM (VP9) pairs for the Frames scroll spine.
 *
 * The clips are decorative background loops — the site plays its own soundtrack,
 * so audio is stripped. Source clips live outside the repo (default ~/Downloads);
 * outputs land in public/video/frames/{id}.{mp4,webm}.
 *
 * Re-runnable: safe to re-run whenever a clip is regenerated in Flow.
 *
 * Usage:  node scripts/optimize-frame-videos.mjs [sourceDir]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = process.argv[2] ?? join(homedir(), "Downloads");
const outDir = join(repoRoot, "public", "video", "frames");

/** Source basename (in sourceDir) -> output id (matches FRAME_STORIES id / "custom-showcase"). */
const CLIPS = {
  5: "five-inch",
  7: "seven-inch",
  10: "ten-inch",
  13: "thirteen-inch",
  custom: "custom-showcase",
};

function run(args) {
  execFileSync(
    "ffmpeg",
    ["-y", "-hide_banner", "-loglevel", "error", ...args],
    {
      stdio: "inherit",
    },
  );
}

mkdirSync(outDir, { recursive: true });

for (const [srcName, id] of Object.entries(CLIPS)) {
  const src = join(sourceDir, `${srcName}.mp4`);
  if (!existsSync(src)) {
    console.warn(`SKIP ${srcName}.mp4 — not found in ${sourceDir}`);
    continue;
  }

  const mp4 = join(outDir, `${id}.mp4`);
  const webm = join(outDir, `${id}.webm`);

  // Erase the Veo/Gemini sparkle watermark baked into the bottom-right of the source
  // (delogo interpolates from surrounding pixels — clean on the matte void). Same box
  // as the hero sequence; all clips are Veo outputs with the mark in the same spot.
  const DELOGO = "delogo=x=1112:y=548:w=92:h=108";

  // H.264 MP4 — broad compatibility, faststart for streaming, no audio.
  run([
    "-i",
    src,
    "-an",
    "-vf",
    DELOGO,
    "-c:v",
    "libx264",
    "-crf",
    "24",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ]);

  // VP9 WebM — smaller for modern browsers, no audio.
  run([
    "-i",
    src,
    "-an",
    "-vf",
    DELOGO,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "34",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    webm,
  ]);

  console.log(`OK  ${srcName}.mp4 -> ${id}.{mp4,webm}`);
}

console.log(`\nDone. Outputs in ${outDir}`);
