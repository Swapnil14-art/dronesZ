/**
 * Re-encode the scroll-scrub frame sequences from JPEG → WebP.
 * WebP decodes fast enough for 100-frame scrubbing (AVIF decode is too slow for that)
 * and roughly halves the payload at visually-equivalent quality.
 *
 * Re-runnable. Writes NNN.webp next to each NNN.jpg; it does NOT delete the JPEGs
 * (do that once the .webp set is verified). sharp lives only in the pnpm store here
 * (not at the repo root), so it's required via an absolute path — see build-progress notes.
 *
 *   node scripts/optimize-frame-sequences.mjs
 */
import { createRequire } from "node:module";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(
  path.resolve("node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"),
);

const DIRS = ["public/hero-seq", "public/custom-seq"];
const QUALITY = 72; // visually lossless for blurred footage; tune if needed

const kb = (b) => (b / 1024).toFixed(0);

for (const dir of DIRS) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort();
  let inBytes = 0;
  let outBytes = 0;

  for (const f of files) {
    const src = path.join(dir, f);
    const out = path.join(dir, f.replace(/\.jpg$/, ".webp"));
    await sharp(src).webp({ quality: QUALITY, effort: 5 }).toFile(out);
    inBytes += (await stat(src)).size;
    outBytes += (await stat(out)).size;
  }

  const saved = inBytes ? Math.round((1 - outBytes / inBytes) * 100) : 0;
  console.log(
    `${dir}: ${files.length} frames  ${kb(inBytes)}kB JPEG → ${kb(outBytes)}kB WebP  (−${saved}%)`,
  );
}
