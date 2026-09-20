# Research — DronesZ Cinematic Scroll Site

_Phase: `/research` (reuse-first) · 2026-06-25 · feeds `/plan`_

## 0. In-repo reuse check
Repo is **empty (greenfield)** — nothing internal to reuse. Proceed to external reuse.

---

## 1. Award-winning scroll-storytelling — best practices (evidence-based)

**The winning architecture (used by Awwwards SOTD sites, Apple product pages):**
- **Smooth scroll layer** (Lenis) normalizes jank and drives a single rAF loop. It is the
  backbone every modern scroll-site sits on; Locomotive is legacy by comparison.
- **GSAP + ScrollTrigger** for scroll-bound timelines: pin, scrub, snap-to-labels. One
  timeline per "chapter", durations act as *proportions* of scroll distance.
- **Scroll-scrubbed hero motion** → the AirPods technique. **Key finding: do NOT scrub a
  `<video>` element** — backward scrubbing is janky and codec-dependent. The performant,
  frame-accurate method is a **pre-baked image sequence drawn to `<canvas>` in rAF**, cutting
  payload ~80% vs frame stacks and skipping DOM reflow. Real-time R3F is the alternative when
  the scene must stay *interactive* during scrub.
- **Restraint wins.** Award sites use motion to *clarify*, with few big moments, not constant
  movement. Reveal-on-enter (fade/slide/scale), parallax for depth, staggered sequences.
- **Performance discipline is non-negotiable** for the award tier: compositor-only props
  (transform/opacity/clip-path), lazy everything below the fold, refresh ScrollTrigger after
  layout settles, kill desync with the Lenis↔GSAP ticker bridge.
- **Reduced-motion is a first-class path**, not an afterthought — gate all scroll timelines
  behind `gsap.matchMedia()` / `prefers-reduced-motion`.

**Reconciling our Layer-3 hero (interactive 3D) with scrub performance:**
- **Hero idle + drag** → real-time **R3F** (draggable, alive). 
- **Assembly sequence (scroll-scrubbed)** → two viable paths:
  1. **R3F timeline driven by ScrollTrigger scrub** — keeps it true-3D & cohesive with the
     hero; cost: heavier, must hold 60fps on a low-poly model.
  2. **Pre-baked canvas image sequence** — frame-perfect, lightest, but not interactive mid-scrub.
  → **Recommendation:** start with **path 1** (single low-poly drone, perf-budgeted); keep
  **path 2 as the documented fallback** if we can't hold framerate on mid devices.

## 2. Reuse decision (adopt — don't hand-roll)

| Need | Adopt | Verdict |
|---|---|---|
| Smooth scroll | **lenis** (`lenis/react` → `ReactLenis`) | Adopt. Benchmark-leading, tiny, official React binding. |
| Scroll timelines | **gsap** + **ScrollTrigger** + **@gsap/react** (`useGSAP`) | Adopt. GSAP is now 100% free incl. all plugins (Webflow). Industry standard for award scroll. |
| 3D | **three** + **@react-three/fiber** + **@react-three/drei** | Adopt. `useGLTF`, loaders, controls out of the box. |
| Component micro-motion | **motion** (formerly framer-motion) | Adopt — but **scoped**: use for component states/page transitions; GSAP owns scroll timelines. No overlap. |
| Forms validation | **zod** | Adopt. |
| Email delivery | **resend** | Adopt (env-gated, logs-only fallback). |
| Styling | **tailwindcss** v4 + OKLCH tokens | Adopt. |
| Analytics | **@vercel/analytics** + **@vercel/speed-insights** | Adopt. |

**Build new (genuinely novel):** the DronesZ *content/storyboard*, the design system tokens,
the chapter scroll choreography, the assembly sequence, the Veo prompt templates + the
video-optimization script. Nothing off-the-shelf fits these — they are the product.

## 3. Key API facts the plan MUST respect (from Context7)

**Lenis ↔ GSAP bridge (canonical):**
```js
// ReactLenis root with autoRaf:false; drive raf from GSAP ticker
<ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />
useEffect(() => {
  const update = (t) => lenisRef.current?.lenis?.raf(t * 1000);
  gsap.ticker.add(update);
  lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);
  return () => gsap.ticker.remove(update);
}, []);
```
**GSAP in React/Next:**
- `import { useGSAP } from "@gsap/react"; gsap.registerPlugin(useGSAP, ScrollTrigger)`.
- `useGSAP(() => {...}, { scope: containerRef })` → auto-reverts all tweens/ScrollTriggers on
  unmount. Wrap event-handler animations in `contextSafe()` and remove listeners in cleanup.
- Call `ScrollTrigger.refresh()` after layout/content settles (fonts, images, dynamic height).
- Scrub timeline durations are *proportional* to scroll distance; use `pin: true`, `start`,
  `end: "+=N"`, `scrub: 1`, `snap: { snapTo: "labels" }`.

**R3F in Next.js App Router:**
- Canvas component is `'use client'`; import it from the page via
  `next/dynamic(() => import('./Scene'), { ssr: false })` — three.js touches browser APIs at import.
- Models in `/public`, loaded with `useGLTF` (drei); preload with `useGLTF.preload`.

**Motion (framer-motion):** package is now `motion` (`import { motion } from "motion/react"`).

**Video:** ship **MP4 (H.264) + WebM (VP9/AV1)**, `muted playsInline loop preload="none"`,
`poster`, lazy via IntersectionObserver. **Never GIF.** For *scrubbed* hero motion use a
frame sequence/canvas, not a video element.

## 4. Risks of chosen dependencies
- **R3F bundle weight** — three.js is large. Mitigate: dynamic `ssr:false`, single low-poly
  GLB, draco/meshopt compression, render only when in view (`frameloop="demand"` where possible).
- **GSAP licensing** — now free incl. plugins under Webflow stewardship; standard "no-charge"
  license. No cost risk. (ScrollSmoother also free now, but we use Lenis.)
- **Lenis + native scroll-driven CSS / anchor links** — Lenis hijacks scroll; must use
  `lenis.scrollTo()` for in-page anchors (the "Frames" nav button) and test focus/skip-links.
- **Tailwind v4** — config is CSS-first (`@theme`); ensure tooling/IDE current.
- **Motion vs GSAP overlap** — enforce the boundary (GSAP=scroll, Motion=component) to avoid
  two animation engines fighting over the same elements.
- **Reduced-motion / a11y** — every scroll timeline must have a static fallback or it fails
  the award-tier (and accessibility) bar.

## Reuse decision summary
Adopt the proven stack above wholesale; build only the DronesZ-specific content, design
system, scroll choreography, and media pipeline. No 80%-fit template replaces those.

## Sources
- darkroomengineering/lenis (Context7) · gsap_llms_txt + gsap.com/resources/React (Context7)
- Codrops (tympanus.net) scroll tutorials 2025–2026 · gsap.com ScrollTrigger docs
- r3f.docs.pmnd.rs + pmndrs/react-three-next · Apple AirPods image-sequence technique writeups
