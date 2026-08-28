/**
 * Pre-Built Frames (×4) + Custom Airframes — the real client-provided narrative for the
 * Frames-only scroll spine (spec §Sections 3–4). Copy is verbatim from the client; images are
 * the optimized flat-lay exploded shots in /public/frames (source PNGs in /frames).
 *
 * `specs` is intentionally empty — the client supplied narrative + tagline only, no spec tables.
 * Do NOT invent weights/batteries; populate once the client sends real numbers.
 * Cinematic clips (spec: 1 per frame) now exist: muted MP4 + WebM loops in /public/video/frames,
 * produced from the Flow/Veo clips by scripts/optimize-frame-videos.mjs. The flat-lay `image`
 * doubles as the video poster and the reduced-motion / mobile fallback.
 */

export interface FrameImage {
  /** Public path to the optimized WebP. */
  src: string;
  /** Intrinsic dimensions of the served WebP — required for CLS-free next/image. */
  width: number;
  height: number;
  alt: string;
}

export interface FrameVideo {
  /** Muted H.264 loop — broad compatibility. */
  mp4: string;
  /** Muted VP9 loop — smaller, modern browsers. */
  webm: string;
}

export interface FrameSpec {
  label: string;
  value: string;
}

export interface FrameStory {
  id: string;
  /** Airframe size badge, e.g. `5"`. */
  size: string;
  eyebrow: string;
  title: string;
  /** Ordered narrative beats — each string is one paragraph. */
  narrative: string[];
  /** Condensed emotional opener for the dossier header (the client's own words). */
  hook?: string;
  tagline: string;
  image: FrameImage;
  /** Cinematic loop; the pinned panel swaps `image` → `video` when present. */
  video?: FrameVideo;
  /** Pending client data — render nothing while empty. */
  specs: FrameSpec[];
}

export const FRAME_STORIES: FrameStory[] = [
  {
    id: "five-inch",
    size: '5"',
    eyebrow: "Where Every Pilot Starts",
    title: "Built for the First Flight. Ready for the Toughest One.",
    narrative: [
      "Every great pilot remembers their first FPV drone.",
      "But they also remember their first broken arm, cracked plate, and the frustration of replacing an entire frame because one component failed.",
      "We believed that had to change.",
      'The DronesZ 5" Airframe was engineered around a simple philosophy: repair what breaks, not what survives.',
      "With a modular architecture, field-replaceable arms, reinforced carbon fiber construction, and compatibility with industry-standard electronics, it keeps pilots in the air—not at the workbench.",
      "Whether you're learning FPV, training operators, capturing cinematic footage, or flying tactical missions, this platform is built to evolve with you.",
      "Because every expert pilot once started with a first flight.",
    ],
    hook: "Every great pilot remembers their first FPV drone — and their first broken arm. We believed that had to change.",
    tagline: "The beginning of every mission.",
    image: {
      src: "/frames/5.webp",
      width: 1295,
      height: 1848,
      alt: "DronesZ 5-inch FPV airframe, exploded flat-lay of its modular carbon fiber and red 3D-printed components.",
    },
    video: {
      mp4: "/video/frames/five-inch.mp4",
      webm: "/video/frames/five-inch.webm",
    },
    specs: [],
  },
  {
    id: "seven-inch",
    size: '7"',
    eyebrow: "When Every Kilometer Matters",
    title: "Built to Go Further.",
    narrative: [
      "Sometimes the objective isn't speed.",
      "It's reaching places others can't.",
      "Long-range surveillance. Border monitoring. Industrial inspections. Infrastructure mapping.",
      "Every extra minute in the air matters. Every unnecessary gram becomes the enemy.",
      'The DronesZ 7" Airframe is optimized for endurance without sacrificing structural strength.',
      "Longer arms. Greater efficiency. Stable flight characteristics. Payload flexibility.",
      "Designed for extended-range operations while maintaining the modular DNA that allows quick repairs in the field.",
      "Because missions shouldn't end because of a damaged arm. They should continue.",
    ],
    hook: "Sometimes the objective isn't speed. It's reaching places others can't.",
    tagline: "Built for the kilometers ahead.",
    image: {
      src: "/frames/7.webp",
      width: 1168,
      height: 1666,
      alt: "DronesZ 7-inch long-range FPV airframe, exploded flat-lay showing its extended carbon arms and standoffs.",
    },
    video: {
      mp4: "/video/frames/seven-inch.mp4",
      webm: "/video/frames/seven-inch.webm",
    },
    specs: [],
  },
  {
    id: "ten-inch",
    size: '10"',
    eyebrow: "When Payload Becomes Purpose",
    title: "Carry More. Do More.",
    narrative: [
      "Not every drone is built to carry a camera.",
      "Some carry thermal sensors. Others carry LiDAR. Some support emergency response. Some serve those protecting the nation.",
      'The DronesZ 10" Airframe was developed for missions where payload defines capability.',
      "Its larger structural footprint enables higher payload capacity while maintaining rigidity, vibration control, and efficient power distribution.",
      "Whether supporting defence surveillance, industrial inspection, precision agriculture, or research, the platform is engineered to adapt—not limit—the mission.",
      "Built stronger. Built smarter. Built for the next challenge.",
    ],
    hook: "Not every drone is built to carry a camera. Some carry thermal sensors. Others carry LiDAR. Some serve those protecting the nation.",
    tagline: "Engineered for missions that demand more.",
    image: {
      src: "/frames/10.webp",
      width: 1053,
      height: 1502,
      alt: "DronesZ 10-inch heavy-lift airframe, exploded flat-lay of its larger structural plates and payload mounts.",
    },
    video: {
      mp4: "/video/frames/ten-inch.mp4",
      webm: "/video/frames/ten-inch.webm",
    },
    specs: [],
  },
  {
    id: "thirteen-inch",
    size: '13"',
    eyebrow: "Built When Failure Isn't an Option",
    title: "The Flagship Structural Platform.",
    narrative: [
      "Some missions don't get a second attempt.",
      "Search and rescue. Critical infrastructure inspection. Disaster response. Border surveillance. Tactical reconnaissance.",
      "When failure carries consequences, the platform itself must inspire confidence.",
      'The DronesZ 13" Airframe represents our most capable structural platform yet.',
      "Designed with high-strength composite materials, reinforced geometry, and modular serviceability, it supports larger propulsion systems, heavier payloads, and longer endurance.",
      "Every structural member has a purpose. Every gram has been optimized. Every component is designed with manufacturability, reliability, and field maintainability in mind.",
      "This isn't just our biggest airframe. It's the foundation of where DronesZ is headed.",
    ],
    hook: "Some missions don't get a second attempt. When failure carries consequences, the platform itself must inspire confidence.",
    tagline: "Built for the missions that matter most.",
    image: {
      src: "/frames/13.webp",
      width: 1000,
      height: 1427,
      alt: "DronesZ 13-inch flagship airframe, exploded flat-lay of its high-strength composite structure and reinforced geometry.",
    },
    video: {
      mp4: "/video/frames/thirteen-inch.mp4",
      webm: "/video/frames/thirteen-inch.webm",
    },
    specs: [],
  },
];

/**
 * Shared aspect for every dossier specimen box = the widest frame's photo aspect. All four cards
 * occupy one identical footprint AND — since scripts/pad-frame-specimens.mjs padded the flat-lays to
 * this same aspect — the photos themselves now paint at an identical width and height, edge to edge,
 * with no letterbox bars. Taking the max still guarantees nothing is ever cropped. The panel's
 * anchor remap therefore resolves to ~identity now, but is kept so an off-aspect frame added later
 * still maps correctly.
 */
export const FRAME_BOX_ASPECT = Math.max(
  ...FRAME_STORIES.map((s) => s.image.width / s.image.height),
);

export interface CustomAirframes {
  eyebrow: string;
  title: string;
  narrative: string[];
  /**
   * Labels for the process rail, one per step — the nav's "Custom" anchor lands here (see
   * `CustomAirframesSection.tsx`). Originally split from `narrative[3]` ("design it, validate it,
   * manufacture it, bring it to life"); reworded 2026-08-13 at the user's request to a you/we
   * partnership framing instead of a verb checklist.
   *
   * Labels ONLY — no per-step description exists, same rule as the empty `specs` above. If real
   * copy arrives later, widen this to objects.
   */
  process: readonly string[];
  /**
   * Product-category tags rendered between the two-path fork and the Contact section, filling
   * the gap that used to be blank canvas before "GET IN TOUCH". Verbatim per the user's request
   * (2026-08-13) — not invented, same rule as everything else on this page.
   */
  frameTypes: readonly string[];
  tagline: string;
  /** CAD-wireframe-to-hardware showcase loop (no still poster — text-to-video seed). */
  video?: FrameVideo;
}

export const CUSTOM_AIRFRAMES: CustomAirframes = {
  eyebrow: "Because No Two Missions Are the Same",
  title: "Designed Around Your Mission.",
  narrative: [
    "Some operators already know exactly what they need. Others only know the mission they need to accomplish. We build for both.",
    "Whether you already have a complete CAD design or only an idea on paper, our engineering team works with you to transform requirements into production-ready UAV airframes.",
    "Need a specialized inspection platform? A defense-specific configuration? A heavy-lift prototype? A research platform?",
    "We'll design it, validate it, manufacture it, and help bring it to life.",
    "Because innovation shouldn't be limited by what's already on the shelf.",
  ],
  process: ["You Define", "We Engineer", "We Prototype", "We Manufacture"],
  frameTypes: ["VTOL", "FPV Frames", "Quadcopter", "Hexacopter"],
  tagline: "Your Mission. Our Engineering.",
  video: {
    mp4: "/video/frames/custom-showcase.mp4",
    webm: "/video/frames/custom-showcase.webm",
  },
};
