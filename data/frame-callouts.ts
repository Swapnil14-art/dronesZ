/**
 * Engineering-dossier callouts for each pre-built frame. Labels are drawn from the client's own
 * narrative prose (NOT invented specs) and anchored to real parts in the exploded flat-lay photo.
 * `ax/ay` = anchor point on the photo (% of the image box, measured off a calibration grid);
 * `ly` = the label's vertical slot at the right margin (% of the image box) so labels don't
 * collide. Anchors bias right/centre so the leader lines don't cross the whole specimen.
 */
export interface FrameCallout {
  label: string;
  ax: number;
  ay: number;
  ly: number;
}

export const FRAME_CALLOUTS: Record<string, FrameCallout[]> = {
  // ax values below were remapped when the flat-lays were padded to one shared aspect
  // (scripts/pad-frame-specimens.mjs): ax' = intercept + slope*ax, per frame. ay/ly are untouched —
  // padding is horizontal only, so every vertical anchor still maps 1:1.
  "five-inch": [
    // intercept 17.1429, slope 0.657143 (851 → 1295 wide)
    { label: "Field-replaceable arms", ax: 68.4, ay: 21, ly: 18 },
    { label: "Reinforced carbon fiber", ax: 57.9, ay: 34, ly: 37 },
    { label: "Modular 3D-printed core", ax: 55.3, ay: 49, ly: 53 },
    { label: "Industry-standard electronics", ax: 48.0, ay: 61, ly: 73 },
  ],
  "seven-inch": [
    // intercept 9.5890, slope 0.808219 (944 → 1168 wide)
    { label: "Extended long-range arms", ax: 72.6, ay: 22, ly: 18 },
    { label: "Endurance-optimized frame", ax: 46.0, ay: 37, ly: 38 },
    { label: "Payload flexibility", ax: 60.5, ay: 57, ly: 58 },
    { label: "Field-repairable & modular", ax: 43.5, ay: 66, ly: 80 },
  ],
  "ten-inch": [
    // intercept 2.4691, slope 0.949668 (1000 → 1053 wide)
    { label: "Sensor & payload mounts", ax: 51.9, ay: 14, ly: 16 },
    { label: "Larger structural footprint", ax: 59.4, ay: 42, ly: 40 },
    { label: "Vibration-damping standoffs", ax: 86.0, ay: 55, ly: 58 },
    { label: "Higher payload capacity", ax: 48.1, ay: 89, ly: 82 },
  ],
  "thirteen-inch": [
    { label: "Larger-propulsion arms", ax: 78, ay: 22, ly: 18 },
    { label: "Reinforced truss geometry", ax: 45, ay: 44, ly: 40 },
    { label: "Modular standoff mounts", ax: 67, ay: 54, ly: 58 },
    { label: "High-strength composite", ax: 50, ay: 64, ly: 78 },
  ],
};
