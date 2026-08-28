/**
 * Pad the four pre-built-frame flat-lays to ONE shared aspect ratio, so every dossier specimen
 * renders at an identical width AND height with no visible letterbox seam.
 *
 * Why: the source flat-lays are shot at different aspects (0.46 → 0.70). The dossier box is uniform,
 * so `object-fit: contain` letterboxed the narrower ones — the 5" painted 323px wide inside a 492px
 * box (169px of side bars) while the 13" filled it edge to edge. A flat CSS backdrop can't hide that
 * because the photos carry a horizontal vignette (left edge ~rgb(32-47), right edge ~rgb(22-30)),
 * so the two bars need different colours per image.
 *
 * Fix: extend each image sideways with a smear of its OWN edge column — a per-row edge replicate, so
 * the fill matches the photo exactly on both sides at every height. Encoded once from the lossless
 * PNG sources in /frames (NOT from the served .webp) so there is no generational re-compression.
 *
 * Re-runnable and idempotent: a frame already at its target width is skipped. Originals are
 * recoverable with `git checkout -- public/frames`.
 *
 * After changing anything here, the callout anchors in data/frame-callouts.ts must be remapped by
 * the printed `ax' = intercept + slope*ax` transform — padding shifts every horizontal anchor.
 *
 *   node scripts/pad-frame-specimens.mjs
 */
import { createRequire } from "node:module";
import { stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(
  path.resolve("node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"),
);

/**
 * Shared target aspect = the WIDEST source flat-lay (the 13", 1050x1498). Deliberately the widest:
 * every other frame is then only ever padded, never cropped, so no part is ever cut off.
 */
const TARGET_ASPECT = 1050 / 1498;

/** Served height per frame — matches the current .webp so the payload stays comparable. */
const FRAMES = [
  { name: "5", height: 1848 },
  { name: "7", height: 1666 },
  { name: "10", height: 1502 },
  { name: "13", height: 1427 },
];

const QUALITY = 80; // single encode from lossless PNG, so no generational loss to compensate for
const kb = (b) => (b / 1024).toFixed(0);

const remaps = [];

for (const { name, height } of FRAMES) {
  const src = `frames/${name}.PNG`;
  const out = `public/frames/${name}.webp`;

  const before = await stat(out).then(
    (s) => s.size,
    () => 0,
  );
  const targetWidth = Math.round(height * TARGET_ASPECT);

  // Normalize to the served height first; the padding maths below is all in served pixels.
  const scaled = sharp(src).resize({ height, fit: "inside" });
  const scaledBuf = await scaled.png().toBuffer();
  const { width: srcWidth } = await sharp(scaledBuf).metadata();

  if (srcWidth >= targetWidth) {
    console.log(
      `${name.padEnd(3)} skip — already ${srcWidth}x${height} (target ${targetWidth})`,
    );
    remaps.push({ name, padLeft: 0, srcWidth, targetWidth: srcWidth });
    await sharp(scaledBuf).webp({ quality: QUALITY }).toFile(out);
    continue;
  }

  const pad = targetWidth - srcWidth;
  const padLeft = Math.floor(pad / 2);
  const padRight = pad - padLeft;

  // Edge replicate: stretch the outermost edge column across the pad, so the vignette continues
  // instead of banding against a flat fill.
  //
  // Sample a SLAB (not a single column) and blur it before stretching. A 1px column carries the
  // photo's sensor grain, and smearing it horizontally turns that grain into visible horizontal
  // streaks across the whole pad (measured: sd 5.1/255, plainly visible at 6x brightness and faintly
  // visible at 1x). Averaging EDGE_SLAB columns cuts grain by ~sqrt(n), and a vertical blur removes
  // the rest while preserving the slow top-to-bottom vignette.
  const EDGE_SLAB = 12;
  const BLUR_SIGMA = 8;
  const edge = async (left, width) =>
    width === 0
      ? null
      : sharp(scaledBuf)
          .extract({ left, top: 0, width: EDGE_SLAB, height })
          .blur(BLUR_SIGMA)
          .resize(1, height, { fit: "fill" }) // horizontal average → grain/sqrt(EDGE_SLAB)
          .resize(width, height, { fit: "fill" })
          .png()
          .toBuffer();

  const leftFill = await edge(0, padLeft);
  const rightFill = await edge(srcWidth - EDGE_SLAB, padRight);

  await sharp({
    create: {
      width: targetWidth,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(
      [
        leftFill && { input: leftFill, left: 0, top: 0 },
        { input: scaledBuf, left: padLeft, top: 0 },
        rightFill && { input: rightFill, left: padLeft + srcWidth, top: 0 },
      ].filter(Boolean),
    )
    .webp({ quality: QUALITY })
    .toFile(out);

  const after = await stat(out).then((s) => s.size);
  console.log(
    `${name.padEnd(3)} ${srcWidth}x${height} → ${targetWidth}x${height}` +
      `  pad ${padLeft}/${padRight}  ${kb(before)}kB → ${kb(after)}kB`,
  );
  remaps.push({ name, padLeft, srcWidth, targetWidth });
}

console.log(
  "\nApply to data/frame-callouts.ts — ax' = intercept + slope*ax (ay/ly unchanged: height is untouched):",
);
for (const { name, padLeft, srcWidth, targetWidth } of remaps) {
  const intercept = (padLeft / targetWidth) * 100;
  const slope = srcWidth / targetWidth;
  console.log(
    `  ${name.padEnd(3)} intercept ${intercept.toFixed(4)}  slope ${slope.toFixed(6)}` +
      `  (new aspect ${(targetWidth / Math.round(targetWidth / TARGET_ASPECT)).toFixed(6)})`,
  );
}
