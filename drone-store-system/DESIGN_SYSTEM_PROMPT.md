# DronesZ Cinematic Light Design System & Products Page Prompt Specification

> **Document Type:** Master Design System Extraction & MCP Prompt Blueprint  
> **Target Directory:** `drone-store-system/`  
> **Source Files Extracted:** `styles/global.css`, `styles/tokens.css`, `styles/typography.css`, `components/sections.css`, `components/ui/ui.css`, `components/nav/nav.css`, `components/hero/hero.css`, `components/custom/custom.css`, `components/frames/frames.css`

---

## 1. Executive Summary & Objective

This document serves as the **master technical specification** and **prompt blueprint** for refactoring the customer-facing **Products Page and Storefront UI/UX** in `drone-store-system/`.

### Core Directive
* **Zero Logic Disturbance:** The existing backend APIs (`/api/public/*`, `/api/user/*`), state logic, cart state (`UserAuthContext`), product relationships (`PARENT`, `CHILD`, `STANDALONE`), variant routing (`/store/:parent_slug`), user authentication modals, and order workflows **must remain 100% intact**.
* **Visual & Aesthetic Transformation:** Replace generic or dark UI styles with the official **DronesZ Cinematic Light Visual Identity**, extracting OKLCH color palettes, fluid type scales, technical blueprint backgrounds, glassmorphism headers, red hairline accents, micro-animations, and elevation shadows.
* **Uniformity:** The Products Page, variant details, cart, checkout, and customer dashboard must look and feel like a seamless extension of the main DronesZ marketing experience.

---

## 2. Complete CSS Token Extraction (Source of Truth)

All styling on the main site is built upon CSS custom properties defined in OKLCH color space, fluid `clamp()` type scales, custom cubic-bezier ease functions, and geometric spacing tokens.

### A. Color Palette (OKLCH Precision System)

```css
:root {
  /* ---- Canvas & Surfaces ---- */
  --color-canvas: oklch(98% 0.002 268);       /* Near-white base background */
  --color-canvas-deep: oklch(94.5% 0.006 25);  /* Deep wells, footer, faint warm grey */
  --color-surface: oklch(100% 0 0);           /* Raised cards & white containers */
  --color-surface-hi: oklch(96.5% 0.004 268);  /* Hover & elevated card fills */
  --color-line: oklch(87% 0.008 268);         /* Hairline borders & subtle dividers */

  /* ---- Typography Colors ---- */
  --color-white: oklch(23% 0.018 268);        /* Primary text (Dark Charcoal / Ink) */
  --color-muted: oklch(46% 0.015 268);        /* Secondary text (Medium Grey) */
  --color-faint: oklch(53% 0.012 268);        /* Tertiary / Captions / Eyebrows (WCAG AA) */
  --color-on-dark: oklch(98% 0 0);            /* Crisp light text on red fills / dark void */
  --color-void: oklch(14% 0.006 268);         /* Deep matte void behind media & specimens */

  /* ---- DronesZ Signature Brand Red ---- */
  --color-brand-red: oklch(55% 0.224 27);     /* Signature Crimson Red (AA on white) */
  --color-brand-red-hi: oklch(61% 0.232 27);  /* Hover / Active interactive state */
  --color-brand-red-dim: oklch(48% 0.17 27);  /* Subtle borders & pill outlines */

  /* ---- Soft Breather Bands ---- */
  --color-breather: oklch(95.5% 0.022 22);    /* Soft warm-red tinted background band */
  --color-breather-ink: oklch(24% 0.02 25);   /* Dark text over breather section */
}
```

### B. Typography & Fluid Clamp Scale

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Fluid Clamp Scales */
  --text-xs: clamp(0.75rem, 0.72rem + 0.15vw, 0.85rem);
  --text-sm: clamp(0.875rem, 0.84rem + 0.18vw, 0.95rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem);
  --text-xl: clamp(1.6rem, 1.3rem + 1.4vw, 2.4rem);
  --text-2xl: clamp(2.2rem, 1.6rem + 2.8vw, 4rem);
  --text-hero: clamp(2.8rem, 1rem + 8vw, 9rem);
}
```

### C. Spacing, Radii & Motion Tuning

```css
:root {
  /* Spacing Rhythm */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.75rem;
  --space-4: 3rem;
  --space-section: clamp(5rem, 3rem + 8vw, 12rem);
  --space-gutter: clamp(1.25rem, 0.5rem + 3vw, 4rem);

  /* Border Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.25rem;

  /* Easing & Durations */
  --duration-fast: 160ms;
  --duration-normal: 320ms;
  --duration-slow: 640ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
}
```

---

## 3. Detailed Component Architecture & Visual Patterns

### A. Header Navigation (`.nav`)
* **Glassmorphism Backdrop:** `backdrop-filter: blur(12px);` combined with `color-mix(in oklch, var(--color-canvas) 70%, transparent)`.
* **Border:** Hairline bottom border `1px solid var(--color-line)`.
* **Wordmark Brand Mark:** "Drones" in `--color-white`, "Z" in `--color-brand-red` with optical baseline correction (`display: inline-block; transform: translateY(0.8px);`).
* **Animated Underline Hover Effect:** `::after` pseudo-element growing smoothly from the left:
  ```css
  .nav__link::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    height: 2px;
    width: 100%;
    background: var(--color-brand-red);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--duration-normal) var(--ease-out-expo);
  }
  .nav__link:hover::after, .nav__link[aria-current="page"]::after {
    transform: scaleX(1);
  }
  ```

### B. Product Cards (`.dronesz-card` & `.path-card`)
* **Base Surface:** Crisp white background (`var(--color-surface)`), hairline border (`1px solid var(--color-line)`), top accent bar (`border-top: 2px solid var(--color-brand-red)`).
* **Technical Mesh Background Overlay:** Optional 45-degree subtle repeating mesh:
  ```css
  background: repeating-linear-gradient(
    45deg,
    transparent 0 22px,
    color-mix(in oklch, var(--color-line) 30%, transparent) 22px 23px
  ), var(--color-surface);
  ```
* **Hover Micro-Interaction:** Lift effect + subtle OKLCH red ambient drop-shadow:
  ```css
  .dronesz-card:hover {
    transform: translateY(-4px);
    border-color: var(--color-brand-red);
    box-shadow: 0 24px 50px -30px color-mix(in oklch, var(--color-brand-red) 50%, transparent);
  }
  ```

### C. Eyebrows & Section Labels (`.section-label`)
* **Structure:** Red horizontal rule prefix + tracked uppercase caption:
  ```css
  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-faint);
  }
  .section-label::before {
    content: "";
    width: 2.25rem;
    height: 1px;
    background: var(--color-brand-red);
  }
  ```

### D. Badges & Product Type Tags (`.type-tag` & `.frames__badge`)
* **Pill Geometry:** Fully rounded (`border-radius: 999px;`), padding `0.3rem 0.85rem`.
* **Typography:** `letter-spacing: 0.18em; text-transform: uppercase; font-size: var(--text-xs); font-weight: 600;`.
* **Color Schemes:**
  * **Brand Red / Variant Pill:** `color: var(--color-brand-red); background: color-mix(in oklch, var(--color-brand-red) 6%, var(--color-surface)); border: 1px solid color-mix(in oklch, var(--color-brand-red) 32%, var(--color-line));`.
  * **Available Status:** `color: #059669; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);`.
  * **Out of Stock:** `color: #dc2626; background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25);`.

### E. Buttons & Interactive Primitives (`.btn`)
* **Primary Red Fill (`.btn--primary`):**
  ```css
  .btn--primary {
    background: var(--color-brand-red);
    color: var(--color-on-dark);
    padding: 0.7rem 1.4rem;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--text-sm);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px color-mix(in oklch, var(--color-brand-red) 30%, transparent);
    transition: transform var(--duration-fast) var(--ease-out-expo), background-color var(--duration-fast) var(--ease-out-expo), box-shadow var(--duration-fast) var(--ease-out-expo);
  }
  .btn--primary:hover:not(:disabled) {
    background: var(--color-brand-red-hi);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px color-mix(in oklch, var(--color-brand-red) 40%, transparent);
  }
  .btn--primary:active:not(:disabled) {
    transform: translateY(1px) scale(0.99);
  }
  ```
* **Ghost / Secondary Button (`.btn--ghost`):**
  ```css
  .btn--ghost {
    background: transparent;
    color: var(--color-white);
    border: 1px solid var(--color-line);
    padding: 0.7rem 1.4rem;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out-expo);
  }
  .btn--ghost:hover {
    border-color: var(--color-brand-red);
    color: var(--color-brand-red-hi);
    background: var(--color-surface-hi);
  }
  ```

### F. Technical Specimen & Dark Media Stage (`.model-viewer__canvas` / `.frame-visual`)
* **Dark Matte Slot:** `background: var(--color-void);` (`oklch(14% 0.006 268)`) with `border-radius: var(--radius-lg);`.
* **Blueprint Technical Grid Background:**
  ```css
  background-color: var(--color-canvas);
  background-image:
    linear-gradient(oklch(0% 0 0 / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0% 0 0 / 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  ```

### G. Modals & Account Popups (`.modal-overlay` & `.modal-content`)
* **Overlay:** Fixed inset, `background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 1000;`.
* **Content Container:** Crisp white background (`var(--color-surface)`), `border-radius: var(--radius-lg)`, `border-top: 4px solid var(--color-brand-red)`, `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12)`.

---

## 4. MCP Agent Prompt Blueprint: Refactoring Products Page UI/UX

```markdown
### MCP TASK: Refactor Customer Products Page & Storefront to DronesZ Cinematic Light Identity

You are asked to apply the DronesZ Cinematic Light Design System to the customer-facing Products page and store components (`PublicStore.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `UserDashboard.tsx`, `UserAuthModal.tsx`, `index.css`).

#### STRICT CONSTRAINTS (DO NOT VIOLATE):
1. PRESERVE ALL BACKEND LOGIC: Do not modify API routes (`/api/public/*`, `/api/user/*`), entity relationships (`PARENT`, `CHILD`, `STANDALONE`), state hooks, cart state calculations, address CRUD, or payment gateway notices.
2. KEEP ALL PRODUCT FEATURES: Product filtering, parent-to-child variant series navigation (`/store/:parent_slug`), product detail specifications modal, add-to-cart authentication triggers, and subtotal/tax calculations MUST stay 100% functional.
3. ADOPT EXACT STYLING SYSTEM:
   - Base canvas: `var(--color-canvas)` (`oklch(98% 0.002 268)`).
   - Text color: `var(--color-white)` (`oklch(23% 0.018 268)` dark ink) and `var(--color-muted)` (`oklch(46% 0.015 268)`).
   - Brand Red Accents: `var(--color-brand-red)` (`oklch(55% 0.224 27)`) and hover `var(--color-brand-red-hi)`.
   - Card Architecture: Crisp white cards with `border-top: 2px solid var(--color-brand-red)`, hairline `1px solid var(--color-line)` borders, and hover elevation `translateY(-4px)` with OKLCH red ambient drop-shadow.
   - Headers: Glassmorphic sticky header (`backdrop-filter: blur(12px)`, `color-mix(in oklch, var(--color-canvas) 70%, transparent)`).
   - Wordmark: "Drones" + "Z" in brand red with `display: inline-block; transform: translateY(0.8px);`.
   - Buttons: `.btn--primary` (crimson red fill with light text) and `.btn--ghost` (transparent with hairline border and red hover).
   - Section Labels: Eyebrow text with `::before` red line prefix (`width: 2.25rem; height: 1px; background: var(--color-brand-red);`).
   - Badges: Rounded pill badges (`border-radius: 999px`) with tracked uppercase typography (`letter-spacing: 0.18em`).

#### IMPLEMENTATION STEPS:
Step 1: Ensure `frontend/src/index.css` contains all extracted OKLCH color variables, fluid clamp typography tokens, section scaffolding, and button primitives.
Step 2: Update `PublicStore.tsx` header to use glassmorphic blur backdrop, brand wordmark, section labels, pill badges, and elevated white cards.
Step 3: Update `CartPage.tsx`, `CheckoutPage.tsx`, and `UserDashboard.tsx` to utilize identical visual tokens, blueprint grids, pill badges, and crimson button styles.
Step 4: Verify with `npx tsc --noEmit` and confirm zero breaking changes.
```

---

## 5. Verification Checklist

- [x] All OKLCH color variables extracted from `styles/tokens.css`
- [x] All typography clamp scales and font family rules documented
- [x] All micro-animations, easements, and button transitions specified
- [x] Blueprint grids, technical dropzones, and dark void media stages specified
- [x] Section label eyebrows and underline hover animations extracted
- [x] MCP Prompt instructions formatted for zero backend logic regression
