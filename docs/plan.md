# Plan — DronesZ Cinematic Scroll Site

_Phase: `/plan` · 2026-06-25 · feeds `/architect` (ADR-1) + `/design` brief, then `/implement`_
_Inputs: docs/spec.md, docs/research.md, memory/dronesz-project-decisions.md_
_Build root: project root (`/Users/vasuagrawal/Desktop/Work/DronesZ Website`). Git remote `github.com/droneszindia/website` wired at ship time._

## Objective
Greenfield, Awwwards-level cinematic scroll-driven marketing site for DronesZ India.
Next.js App Router + TS on Vercel. Five product families told through tiered scroll
storytelling. Callable lead capture via Zod-validated, rate-limited forms (Resend). All
content in TS data files for clean swap when brochures + Veo clips arrive. Build now with
placeholder content, placeholder GLB, placeholder video.

## Surface map (all net-new)
```
app/
  layout.tsx                root shell + providers
  page.tsx                  home scroll spine (10 sections)
  products/page.tsx
  contact/page.tsx
  api/contact/route.ts
  api/frames-lead/route.ts
components/
  providers/LenisGSAPProvider.tsx   rAF bridge (critical)
  nav/Nav.tsx
  scroll/ScrollSection.tsx          pinned-chapter primitive
  scroll/useScrollTimeline.ts
  hero/HeroSection.tsx
  hero/HeroScene.tsx                R3F canvas (dynamic ssr:false)
  hero/AssemblyCanvas.tsx           canvas image-sequence fallback
  chapters/{PreBuilt,Counter,Consumer,Lab}Chapter.tsx
  products/{ProductCard,VideoSlot,ProductGrid}.tsx
  pillars/PillarsSection.tsx
  frames/{FramesSection,FramesForm}.tsx
  contact/{ContactSection,ContactForm}.tsx
  footer/Footer.tsx
  ui/{Button,SectionLabel,AnimatedText,FormField}.tsx
lib/
  motion.ts                 gsap.matchMedia() helpers
  lenis.ts                  scrollTo wrapper
  form-schema.ts            shared Zod schemas
  device-capability.ts      R3F vs fallback runtime check
data/
  products.ts               5 categories + >=11 product cards
  chapters.ts               4 chapters + scenes
  site.ts                   nav, meta, pillars, footer copy
  veo-prompts.ts            Veo 3.1 prompt templates
public/models/drone-placeholder.glb
public/video/placeholder/{placeholder.mp4,placeholder.webm,placeholder-poster.jpg}
scripts/optimize-video.sh   ffmpeg pipeline
styles/{tokens,typography,global}.css
tests/e2e/{nav,form,visual,a11y}.spec.ts
tests/unit/{form-schema,motion}.test.ts
docs/veo-pipeline.md
```

## Risks & unknowns
| # | Risk | Sev | Mitigation |
|---|------|-----|------------|
| R1 | R3F bundle blows JS budget | High | dynamic ssr:false, frameloop="demand", draco GLB, @next/bundle-analyzer after P4 |
| R2 | Assembly scrub < 60fps on mid devices | High | ADR-1 runtime threshold → auto-switch to canvas fallback |
| R3 | Lenis anchor scroll fails after hydration race | Med | scrollTo in useEffect; Playwright test after layout settles |
| R4 | Tailwind v4 CSS-first @theme breaks pipeline | Med | pin exact v4 version; verify at P1 |
| R5 | motion + GSAP fight over same element | Med | enforce boundary: GSAP=scroll transforms, motion=entry/exit states only |
| R6 | Resend key absent → route throws | Low | guard `if(!RESEND_API_KEY)` before any resend call |
| R7 | Branded GLB has different hierarchy than placeholder | Low | abstract behind `<DroneModel url=.../>` |
| R8 | Video files absent → tests fail | Low | assert element presence only; poster as visible fallback |
| R9 | ScrollTrigger.refresh() before fonts/images load | Med | refresh inside font-ready + image-load chain; documented in useScrollTimeline |

## Where /architect is needed
- **ADR-1 (blocks Phase 4) — Hero assembly: R3F-scrub vs canvas image-sequence fallback.**
  Decide the runtime threshold that triggers fallback (`hardwareConcurrency` / `deviceMemory` /
  fps-probe) and whether path-2 frames are committed assets or build-time generated. Load-bearing.
- **ADR-2 (non-blocking, resolve in P3 via code comment) — LenisGSAPProvider + ScrollSection
  structure.** Follow the canonical bridge in research.md; document in provider header. No formal ADR.

## Where /design is needed
- **Design brief (blocks Phase 6, produce in parallel with Phase 4):** final OKLCH token values,
  font pairing, per-chapter mood/scene descriptions, red-accent usage rules. Large user-facing
  surface → brief is warranted.

## Parallelization
```
P1 → P2 → P3 ─┬─ P4 (3D/hero)   ─┐
              ├─ P5 (data model)  ├─ P6 (chapters+pages) ─ P9 (tests) ─ P10 (deploy)
              ├─ P7 (forms)      ─┘
              └─ P8 (video pipeline) ──────────────────────────────────┘
```
P1→P2→P3 sequential. After P3: P4/P5/P7/P8 parallel. P6 needs P3+P4+P5+design. P9 needs P6+P7. P10 needs P9.

---

## Phases

### Phase 1 — Scaffold + Tooling
Goal: working `pnpm dev`; full deps; TS + Tailwind v4 configured; env template.
Files: package.json, next.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.mjs,
styles/* stubs, app/layout.tsx (bare), app/page.tsx (blank), .env.local.example
(`RESEND_API_KEY=`, `CONTACT_TO_EMAIL=`, `RATE_LIMIT_MAX=5`).
Deps: next react react-dom typescript @types/* tailwindcss @tailwindcss/postcss postcss
lenis gsap @gsap/react three @react-three/fiber @react-three/drei motion zod resend
@vercel/analytics @vercel/speed-insights; dev: @types/three eslint eslint-config-next
prettier @playwright/test axe-core @axe-core/playwright.
**Exit:** `pnpm dev` → 200 blank page, 0 console errors; `pnpm build` ok; `pnpm tsc --noEmit` 0.

### Phase 2 — Design Tokens + Typography
Goal: all OKLCH tokens in CSS; font loaded; resets + reduced-motion overrides. Tokens only.
Files: styles/tokens.css (@theme: --color-canvas near-black, --color-brand-red OKLCH, --color-white,
--color-muted/surface, fluid --text-* clamp scale, --space-*, --duration-*, --ease-out-expo),
styles/typography.css (next/font, font-display swap), styles/global.css (resets, :focus-visible red
ring, prefers-reduced-motion reduce override), app/layout.tsx imports global.css + semantic html/body.
**Exit:** body bg near-black; :root shows OKLCH vars; font loads w/o shift; build green.

### Phase 3 — Motion Foundation (Lenis + GSAP Provider + Reduced-Motion)
Goal: Lenis active; GSAP ticker bridge; matchMedia reduced-motion gates; ScrollSection primitive.
Most architecturally sensitive phase.
Files: components/providers/LenisGSAPProvider.tsx (ReactLenis root autoRaf:false; registerPlugin
useGSAP+ScrollTrigger; gsap.ticker.add raf*1000; lenis.on('scroll',ScrollTrigger.update);
lagSmoothing(0); LenisContext exposes scrollTo; useLenis hook; cleanup), lib/motion.ts
(createReducedMotionMM via gsap.matchMedia no-preference/reduce branches; prefersReducedMotion()),
components/scroll/ScrollSection.tsx (pinned wrapper; props id/children/scrollDistance/onTimeline;
reduced branch = final state instantly, no pin), components/scroll/useScrollTimeline.ts (refresh
pattern), app/layout.tsx wraps children in provider.
**Exit:** scroll Lenis-smooth; reduced-motion → instant scroll, 0 timelines (sentinel log); stub
Frames button scrollTo reaches anchor; build green; tsc 0.

### Phase 4 — 3D Hero (R3F Scene + Assembly) — needs ADR-1
Goal: interactive R3F drone; scroll-scrubbed assembly; canvas fallback stub; bundle verified.
Files: public/models/drone-placeholder.glb (CC0 low-poly <2MB draco; fallback drei <Box> parts),
components/hero/HeroScene.tsx ('use client'; Canvas frameloop="demand"; useGLTF; pointer-drag
rotate; named nodes for assembly), components/hero/HeroSection.tsx (dynamic import ssr:false;
tagline; scroll-cue; useGSAP scrub parts in), components/hero/AssemblyCanvas.tsx (canvas PNG frame
sequence; activated when !canHandleR3F or reduced-motion), lib/device-capability.ts (canHandleR3F:
hardwareConcurrency>=4 && deviceMemory>=2; exact from ADR-1), app/page.tsx renders HeroSection.
**Exit:** 3D drone on dark bg; drag rotates; scroll starts assembly; reduced-motion static; R3F not
in initial chunk (bundle-analyzer); Lighthouse mobile >=70 informal.

### Phase 5 — Content Data Model
Goal: typed TS data files; placeholder content for every product/chapter/copy/Veo prompt. Brochure
swap = edit data only.
Files: lib/form-schema.ts (ContactFormSchema name/email/phone?/message/_hp honeypot;
FramesLeadSchema name/email/interest; z.string().trim(); inferred types), data/products.ts (types
VideoSlot/ProductCard/ProductCategory; 5 categories: pre-built[6], counter-systems[2], consumer[1],
components[0 — FramesSection handles], lab-setup[4 tiles]; video paths → placeholder), data/chapters.ts
(ChapterScene/Chapter; 4 chapters w/ scenes + visualHint), data/site.ts (nav, meta, 3 pillars,
footer, placeholder contact), data/veo-prompts.ts (SHARED_BRAND_PROMPT; VeoPrompt type; >=11 entries).
**Exit:** tsc 0; categories.length===5; product cards >=11; veoPrompts === total cards; no hardcoded
copy in components.

### Phase 6 — Page Sections + Chapter Scroll Stories — needs P3+P4+P5+design
Goal: full homepage scroll spine; /products + /contact; 4 chapters via ScrollSection; product cards.
Spine order: Hero → PillarsSection (light breather) → PreBuiltChapter + ProductGrid(pre-built) →
CounterChapter + ProductGrid(counter) → ConsumerChapter + ProductGrid(consumer) →
FramesSection#frames-section (Coming Soon + FramesForm) → LabChapter (light breather, 4 tiles) →
ContactSection (teaser → /contact) → Footer.
Files: components/nav/Nav.tsx (fixed dark glass, red active; Frames → useLenis().scrollTo
("#frames-section")), pillars/PillarsSection.tsx, chapters/*Chapter.tsx (ScrollSection + onTimeline;
read data/chapters; every timeline in createReducedMotionMM), products/ProductCard.tsx (name/tagline/
specs/VideoSlot/CTA; hover lift via motion), products/VideoSlot.tsx (video muted playsInline loop
preload=none; 2 sources; IntersectionObserver sets src; poster until play; reduced-motion no
autoplay), products/ProductGrid.tsx, frames/FramesSection.tsx (id, Coming Soon, FramesForm),
contact/ContactSection.tsx + app/contact/page.tsx (ContactForm), app/products/page.tsx (5 category
sections), ui/{Button,SectionLabel,AnimatedText,FormField}.tsx.
Motion discipline: motion=entry/exit+hover; GSAP+ScrollTrigger=scroll timelines; all GSAP behind
createReducedMotionMM.
**Exit:** scroll top→footer all 10 sections, no gaps/overflow; Frames button reaches section;
/products lists 5 categories; /contact renders form; all copy from data; build green.

### Phase 7 — Forms (Lead Capture + API Route) — needs P3+P5
Goal: both forms wired: client Zod, server route (Zod+sanitize+rate-limit+honeypot+Resend), states.
Files: app/api/contact/route.ts (safeParse → reject _hp 400 → in-memory IP rate-limit 429 after
RATE_LIMIT_MAX/15min → strip HTML → if key: resend.emails.send to CONTACT_TO_EMAIL else console.log
→ {success}), app/api/frames-lead/route.ts (same, FramesLeadSchema), contact/ContactForm.tsx
(controlled; client Zod; fetch; states; hidden _hp aria-hidden tabIndex -1), frames/FramesForm.tsx,
ui/FormField.tsx (label+input+error; aria-describedby; aria-invalid).
**Exit:** valid→200 success UI; empty→client errors pre-fetch; _hp set→400; 6 rapid→429; key unset→
200+log no throw; keyboard-only completion; build green.

### Phase 8 — Video Pipeline (Veo Prompts + ffmpeg) — parallel from P3
Goal: Veo prompt templates; ffmpeg script → MP4+WebM+poster; placeholder stubs; handoff doc.
Files: scripts/optimize-video.sh (ffmpeg → H.264 mp4 crf23 preset slow +faststart; VP9 webm 2-pass
crf33; poster jpg @0.5s; scale=1280:-2), data/veo-prompts.ts finalized (outputFileName matches
VideoSlot paths; SHARED_BRAND_PROMPT prepended), public/video/placeholder/* (1s near-black stub
committed), docs/veo-pipeline.md (use Veo 3.1 → download → optimize-video.sh → drop in public/video →
update data/products.ts).
**Exit:** script produces 3 files; VideoSlot renders posters (no broken sources); veo-prompts >=11;
veo-pipeline.md exists.

### Phase 9 — Testing (Playwright visual/a11y/E2E + unit) — needs P6+P7
Goal: Playwright visual @6 breakpoints, a11y, reduced-motion, E2E flows; unit for schemas + motion.
Files: playwright.config.ts (320/375/768/1024/1440/1920; chromium/firefox/webkit; webServer pnpm dev),
tests/e2e/nav.spec.ts (h1 visible; Frames→section in viewport; routes; keyboard tab+enter),
tests/e2e/form.spec.ts (valid→success; empty→error pre-network; frames submit; direct fetch _hp→400),
tests/e2e/visual.spec.ts (screenshots; assert scrollWidth<=innerWidth no overflow),
tests/e2e/a11y.spec.ts (axe 0 critical/serious on /,/products,/contact; emulate reducedMotion →
data-animated="false"), tests/unit/form-schema.test.ts, tests/unit/motion.test.ts.
**Exit:** E2E pass (baselines saved); 0 critical axe; no overflow; unit pass; reduced-motion pass.

### Phase 10 — Vercel Deploy + Perf Audit + Polish — needs P9
Goal: production live; perf budget validated; security headers; Analytics; all acceptance criteria.
Files: next.config.ts headers (HSTS, nosniff, X-Frame DENY, Referrer-Policy, Permissions-Policy,
nonce CSP), app/layout.tsx (<Analytics/> + <SpeedInsights/>).
Steps: pnpm build green → push → connect Vercel + env vars → deploy → PageSpeed on preview.
Perf: bundle-analyzer (R3F deferred); Lighthouse LCP<2.5s CLS<0.1 INP<200ms TBT<200ms.
**Exit (= all spec criteria):** 10 criteria pass; build green; Vercel live; Lighthouse Perf >=80
desktop/>=70 mobile; A11y >=95; 0 prod console errors.

---

## Open questions (with recommended defaults)
1. **GLB placeholder** → use drei `<Box>` part stand-ins during dev (no asset dependency); swap CC0
   Sketchfab GLB before P10. _Recommended._
2. **Rate-limit in prod** → in-memory (resets on cold start) acceptable now; Upstash Redis if stricter
   needed later.
3. **Font pairing** → Inter placeholder in P2; design brief confirms finals before P6.
4. **Analytics custom events** → track form submits (`va.track`)? low-effort, optional.
5. **Veo clip ownership** → Vasu or client runs Veo 3.1; pipeline doc equips either. Confirm before P8 handoff.
