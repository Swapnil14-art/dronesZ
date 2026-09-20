# ADR-1 — Hero Assembly: R3F-scrub vs Canvas Image-Sequence Fallback

_Status: Accepted · 2026-06-25 · Gates Phase 4 · Inputs: docs/research.md §1, docs/plan.md R2_

## Context
The hero must (a) present an interactive, draggable 3D drone and (b) play a scroll-scrubbed
part-by-part assembly. Research established two viable paths for the scrub:

1. **R3F timeline driven by ScrollTrigger** — true 3D, cohesive with the interactive hero, but
   must hold 60fps on mid devices with a low-poly model.
2. **Pre-baked canvas image sequence** — frame-perfect and lightest, but not interactive mid-scrub
   (the AirPods technique).

We are building now with **drei `<Box>` part stand-ins** (decision locked 2026-06-25); a real
low-poly GLB swaps in before deploy.

## Decision

**Primary path = R3F scrub (path 1).** A single low-poly drone whose named parts are driven by a
GSAP timeline bound to the hero's pinned ScrollTrigger. `Canvas frameloop="demand"` so we only
render on drag or scroll, not continuously.

**Fallback = static, not the image sequence — for now.** During the placeholder phase there is no
branded model to pre-bake frames from, so building a path-2 frame pipeline is premature (YAGNI).
The fallback renders a **static poster** of the assembled drone (no scrub, no WebGL) for clients
that fail the capability gate or request reduced motion. `AssemblyCanvas` is scaffolded as the
seam where a real image sequence drops in later, behind the same `data-fallback` boundary.

### Capability gate (the runtime threshold)
`lib/device-capability.ts` → `canHandleR3F()` returns true when **all** hold:
- `navigator.hardwareConcurrency >= 4`
- `navigator.deviceMemory >= 2` (treated as pass when the API is absent — Safari/Firefox don't expose it)
- not `prefers-reduced-motion: reduce`
- WebGL context obtainable

Conservative by design: a false negative costs a static hero (still fine); a false positive costs
jank on a weak device, which is worse. No live fps-probe in v1 — revisit only if field data shows
the static gate misclassifies real devices.

### Frame source (deferred)
When the branded GLB lands and if R3F can't hold 60fps on the target mid device, pre-baked frames
will be **generated offline** (a Blender/headless-three render script committed under `scripts/`),
output as an optimized WebP/AVIF sequence in `public/`, NOT generated at build time (keeps CI fast
and deterministic). This is a documented future option, not built now.

## Consequences
- Phase 4 builds the R3F scene + a static fallback only; `AssemblyCanvas` stays a thin stub.
- R2 (scrub < 60fps) is mitigated by `frameloop="demand"`, low-poly geometry, and the static gate.
- R1 (bundle) handled separately: the whole hero is a `dynamic(() => …, { ssr:false })` import so
  three.js stays out of the initial chunk.
- Revisit trigger: real GLB integrated AND measured fps < 55 on a 4-core/4GB reference device →
  build the offline frame pipeline and activate path 2 inside `AssemblyCanvas`.
