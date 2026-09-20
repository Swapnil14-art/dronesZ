# Spec: DronesZ India — Frames Cinematic Scroll Site

_Status: approved · Owner: Vasu · Last updated: 2026-06-30_
_Pipeline: harness-claude (`/spec` → /research → /plan → /architect+/design → /implement → /review → /security-review → /test → /verify → /ship)_

## SCOPE PIVOT (2026-06-30)
Client narrowed the brief from a full 5-category marketing site to a **single-page,
Frames-only cinematic scroll experience** with a soundtrack he provides. Everything below
reflects the new locked scope. The prior multi-category build (Pre-Built/Counter/Consumer/Lab
product pages, `/products`, multi-section nav) is **shelved, not deleted** — it can return as
a later phase. Frames is promoted from a "Coming Soon" sub-section to the entire site.

Commercials (reference, not build scope): client dev is free (friend); Vasu charges
**₹5,000–5,500** for the visual production (frame modelling/animation + scroll-story work),
framed as design/modelling/animation, NOT "AI credits". Hosting reuses the client's existing
platform + domain. Delivery target: **2 days**.

## Problem
DronesZ wants a single, award-level (Awwwards-grade) scroll-driven page that tells the DronesZ
story and showcases their drone **frames** — converting interest into **callable leads**,
especially for custom frame work. Marketing + lead-gen only.

## In scope
- Greenfield **Next.js (App Router) + TypeScript**. Hosting on the client's existing platform/domain.
- **Single immersive page** (`/`) — no multi-page product catalogue. Optional thin nav anchors only.
- A client-provided **soundtrack** plays under the experience; scroll advances the story to it.
  (Audio must respect autoplay rules + a mute/disable control + reduced-motion/quiet path.)
- **Sections (the story spine):**
  1. **Hero Story** — scroll-driven cinematic intro to DronesZ (who they are, what they stand for).
     Reuses the existing R3F 3D hero where it fits.
  2. **Frames Story** — cinematic scrollytelling on the frames: craft, engineering, the why.
  3. **Pre-Built Frames (×4)** — each of 4 ready frame models gets its own cinematic clip + specs;
     consistent matte-black / red-accent brand-film look.
  4. **Custom Frames** — request section with **two paths**:
     - **Option A — design ready / job-work only:** customer uploads their existing frame file/design.
     - **Option B — design it for me:** customer uploads a brief/summary (or submits with none) and
       DronesZ calls them to work out requirements and design end-to-end.
     Both submit to the company.
- **Lead pipeline:**
  - **Email System** — every submission triggers an email notification to a configured DronesZ address.
  - **Dashboard** — private team view of all custom-frame requests/leads: chosen option, uploaded
    files, and contact details, in one place.
- **Design system**: dark cinematic canvas, red+white brand, OKLCH tokens, locked typography
  (Space Grotesk + Inter); deliberate light "breather" beats for rhythm.
- **Motion stack**: Lenis smooth scroll, GSAP ScrollTrigger, Framer Motion (scoped), React Three
  Fiber for the 3D hero; tasteful shader/particle moments.
- **5 cinematic clips total**: 4 frame models + 1 custom-frames showcase. MP4+WebM, poster frames,
  no GIFs. Produced via the existing brand-film prompt template; content lives in data files.
- Responsive (320→1920), accessible, `prefers-reduced-motion` fallbacks, perf-budgeted.

## Out of scope
- Other product categories (Pre-Built non-frame drones, Counter Systems, Consumer, Lab Setup),
  `/products` catalogue, e-commerce, payments, accounts (beyond dashboard login), CMS, i18n, blog.
- Real branded 3D model, real contact details (swapped later).

## Acceptance criteria
- [ ] `pnpm dev` runs; `/` renders the full single-page story end-to-end.
- [ ] Soundtrack plays under the scroll with a working mute/disable control; reduced-motion/muted
      users get an instant, non-animated, silent experience.
- [ ] Hero + Frames stories are scroll-driven; scrolling advances the narrative beats.
- [ ] All 4 pre-built frames appear with their clip + specs; custom-frames showcase clip plays.
- [ ] Custom Frames form offers **Option A (file ready)** and **Option B (design it for me)**, with
      file/image upload, validates (client + server), rejects bad input, shows success/error states.
- [ ] Each submission routes an email to the configured DronesZ address (no-op+log fallback if creds absent).
- [ ] Dashboard (auth-gated) lists submissions with option, files, and contact details.
- [ ] Content (copy/specs) is read from data files, not hardcoded in components.
- [ ] Video plays optimized MP4+WebM with poster + lazy-load; no GIFs anywhere.
- [ ] Layout holds with no overflow at 320/375/768/1024/1440/1920.
- [ ] Production build passes; deploys to the client's hosting/domain.

## Constraints
- **Performance** (landing): LCP < 2.5s, CLS < 0.1, INP < 200ms; animate only compositor-friendly
  props; lazy-load 3D/video; code-split heavy libs (R3F/GSAP); scope `motion` to micro-interactions
  to keep the JS budget (prior bundle ran 178kB > 150kB — fix during this build).
- **A11y**: semantic HTML, keyboard nav, focus states, contrast (red-on-dark tuned), full
  reduced-motion path, audio not autoplaying without a control.
- **Security**: validated/sanitized form input incl. **upload type/size limits**, rate-limited submit
  endpoint, secrets in env vars, honeypot anti-spam; dashboard behind auth.
- **Quality**: files <800 lines, organized by feature, immutable patterns.

## Open questions (confirm with client)
1. **Option A upload file types** — CAD (STL/STEP) vs images/PDF only? Drives upload + storage handling.
2. **Upload storage** — where do attachments live (Vercel Blob / Supabase / email attachment only)?
3. **Dashboard auth** — simple shared password OK for now, or per-user login?
4. **Email provider** — keep Resend (`RESEND_API_KEY`), or use the client's existing mail?

## Resolved decisions (reference)
- Form backend → Next.js Route Handler + **Resend** (Zod-validated, rate-limited, honeypot;
  logs-only fallback until creds provided). May change per open question 4.
- Package manager → **pnpm**. Analytics → **Vercel Analytics** + Speed Insights.
- See project memory `dronesz-project-decisions.md` for full discovery + pivot history.
