# Design Brief — DronesZ Cinematic Scroll Site

_Phase: `/design` · 2026-06-25 · gates Phase 6 · Inputs: spec.md, memory/dronesz-project-decisions.md, ADR-1_
_Locked: dark cinematic canvas · red + white · Layer-3 motion · tiered storytelling_

## 1. Direction

**Defense-grade editorial.** Not "tech startup glossy," not "gamer RGB." The reference register is
aerospace/defense product cinema — Anduril, SpaceX, Skydio, BAE — crossed with editorial magazine
restraint. Precision instrument, not toy. The drone is the hero; the UI is the matte-black case it
ships in. Red is a targeting/alert signal used sparingly, never decoration.

**Four design-quality qualities we commit to** (per anti-template policy):

1. **Scale contrast** — hero/section heads are huge; body is quiet. No mid-sized mush.
2. **Layering & depth** — 3D drone over gradient canvas, hairline-bordered surfaces, light breathers
   breaking the dark for rhythm.
3. **Semantic color** — red means _this is the point_ (active nav, CTA, key spec, accent geometry),
   never "let's add a color here."
4. **Designed interaction states** — every interactive element has intentional hover/focus/active.

## 2. Color (OKLCH) — refinement of styles/tokens.css

The current tokens are sound. Confirmed values + named usage rules:

| Token                  | Value                  | Use                                  |
| ---------------------- | ---------------------- | ------------------------------------ |
| `--color-canvas`       | `oklch(14% 0.012 268)` | page base                            |
| `--color-canvas-deep`  | `oklch(10% 0.01 268)`  | footer, deepest wells, hero vignette |
| `--color-surface`      | `oklch(20% 0.015 268)` | cards, raised panels                 |
| `--color-surface-hi`   | `oklch(26% 0.016 268)` | hover/elevated                       |
| `--color-line`         | `oklch(32% 0.012 268)` | hairline borders (1px)               |
| `--color-white`        | `oklch(97% 0 0)`       | primary type                         |
| `--color-muted`        | `oklch(72% 0.008 268)` | secondary type / body on dark        |
| `--color-faint`        | `oklch(55% 0.01 268)`  | captions, eyebrows, scroll cue       |
| `--color-brand-red`    | `oklch(58% 0.214 27)`  | primary accent                       |
| `--color-brand-red-hi` | `oklch(66% 0.224 27)`  | hover/active, focus ring             |
| `--color-breather`     | `oklch(96% 0.004 268)` | light section bg                     |
| `--color-breather-ink` | `oklch(20% 0.015 268)` | type on breather                     |

**Red discipline (hard rules):**

- Red covers **≤ ~8%** of any viewport. If a screen looks red, it's wrong.
- Allowed: one CTA per view, active nav item, ≤1 keyword in a heading, key spec figures, thin
  accent geometry (rules, the 3D rim light, focus ring). Never: large fills, body text, every card.
- On the **light breather** sections red stays the accent; ink is near-black, not white.

**Contrast (AA on canvas, verify in Phase 9 axe):** white & muted on canvas pass comfortably;
`brand-red` on canvas ≈ AA for large text only — so **red is for ≥24px / headings / non-text UI**,
never small red body copy on dark.

## 3. Typography — see decision below

Two roles: **Display** (hero, section heads, big numbers) and **Text** (body, labels, UI).
Fluid `--text-*` scale already set. The face pairing is the one open subjective choice — §6.

## 4. Per-chapter mood

Dark spine with deliberate light breathers for rhythm (`■`=dark, `□`=light):

| #   | Section                                     | Mood / scene                                                                         | Bg              |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| 1   | **Hero**                                    | Black-ops reveal. Drone assembles from scattered parts; red rim. Tagline.            | ■ deep vignette |
| 2   | **Pillars** (Innovation/Security/Precision) | Calm statement of intent. First **breather** — white, lots of air, red rule marks.   | □               |
| 3   | **Pre-Built chapter**                       | Size-ladder: drones scale up <4"→payload as you scroll. Confident, kinetic.          | ■               |
| 4   | **Counter Systems chapter**                 | Defense scene. Jammer cone / signal-sweep motif, tension. Most "alert-red" moment.   | ■ deep          |
| 5   | **Consumer chapter**                        | Lighter, accessible, approachable. The 3.5" everyday drone.                          | ■→□ transition  |
| 6   | **Frames (Coming Soon)**                    | Anticipation. Blueprint/wireframe aesthetic, "in fabrication." Lead form.            | ■               |
| 7   | **Lab Setup**                               | Institutional credibility. **Breather** — white, grid of 4 service tiles, technical. | □               |
| 8   | **Contact teaser**                          | Direct, human. "Talk to us." Strong single CTA → /contact.                           | ■               |
| 9   | **Footer**                                  | Quiet sign-off, contact details, nav.                                                | ■ deepest       |

Breathers at §2 and §7 prevent dark-fatigue and give the eye somewhere to rest — the rhythm is the
design, not just the dark.

## 5. Motion language (extends ADR-1, research §1)

- **Reveal-on-enter**: fade + 16–24px rise, `--ease-out-expo`, staggered 60–80ms. Compositor props only.
- **Scrub chapters**: one GSAP timeline per ScrollSection, pinned, `scrub:1`. Durations = proportions.
- **Micro (motion lib)**: hover lift on cards (translateY -4px + surface-hi), button press, nav underline.
- **Restraint**: a few big moments, not constant movement. Every timeline has a reduced-motion resting state.
- **Red as motion accent**: the rim light, a sweeping rule, the targeting reticle — red moves to draw the eye, then settles.

## 6. Typography — LOCKED: Technical Grotesque

**Display = Space Grotesk · Text = Inter** (both already wired in `app/fonts.ts`, no rebuild).
Geometric, instrument-precise; reads aerospace/defense-tech without gimmick.

| Role              | Face / weight               | Tokens                         | Notes                                          |
| ----------------- | --------------------------- | ------------------------------ | ---------------------------------------------- |
| Hero              | Space Grotesk 700           | `--text-hero`, line-height .94 | tight tracking `-0.02em`, `text-wrap: balance` |
| Section head (h2) | Space Grotesk 700           | `--text-2xl`                   | one red keyword max                            |
| Sub-head (h3)     | Space Grotesk 500           | `--text-xl`                    |                                                |
| Eyebrow / label   | Inter 500, uppercase        | `--text-sm`, tracking `0.28em` | `--color-faint` or `--color-brand-red-hi`      |
| Body              | Inter 400/500               | `--text-base`, line-height 1.6 | `--color-muted` on dark                        |
| Spec figures      | Space Grotesk 500 (tabular) | `--text-lg`/`--text-xl`        | use `font-variant-numeric: tabular-nums`       |

Rules: never more than these two families. Headings sentence-case (not ALL CAPS) except eyebrows/labels.
Numbers in spec tables get tabular-nums so columns align.

## 7. Component intent (feeds Phase 6)

- **Nav**: fixed, dark glass (`backdrop-blur`, canvas @ ~70% + hairline bottom border). Active item = red underline grows from left. Frames item → `useLenisScroll().scrollTo("#frames-section")`.
- **Button (primary)**: red fill, white ink, subtle press-scale; **secondary**: hairline border, red on hover.
- **ProductCard**: surface bg, hairline border, hover → surface-hi + translateY -4px; video slot top, name/spec/CTA stacked. Specs use tabular-nums.
- **SurfaceCard / pillar tile**: generous padding, one red rule or icon accent, lots of negative space.
- **Form field**: label above, hairline input, red focus ring (`--color-brand-red-hi`), inline error in red below.
- **Section label**: small uppercase eyebrow + thin red rule, top-left of each chapter.

## 8. Acceptance for this brief

Phase 6 components must: use only the two type families; keep red ≤~8%/view; give every interactive
element a designed hover/focus/active; include the two light breathers (§2, §7); pass AA contrast
(verified Phase 9). No element should look like an unstyled Tailwind/shadcn default.
