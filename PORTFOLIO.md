# Robb Olazo — Developer Portfolio

> **Developer crafting thoughtful digital experiences and solutions.**
> Minimalist B&W, glassmorphism, physics lanyard + AI assistant.  
> Live stack: React 19 + Vite + Tailwind 4 + Three.js/Rapier + Gemini

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Routing & App Shell](#routing--app-shell)
- [Sections & Content](#sections--content)
- [Features](#features)
  - [1. Design System (B&W Minimalist + Glassmorphism)](#1-design-system-bw-minimalist--glassmorphism)
  - [2. Theme (Light/Dark)](#2-theme-lightdark)
  - [3. Navigation](#3-navigation)
  - [4. Hero + Lanyard](#4-hero--lanyard)
  - [5. Projects Archive](#5-projects-archive)
  - [6. Interactivity Layer](#6-interactivity-layer)
  - [7. AI Floating Chat](#7-ai-floating-chat)
  - [8. Miscellaneous Polish](#8-miscellaneous-polish)
- [Components Reference](#components-reference)
- [Hooks & Libs](#hooks--libs)
- [Data Source (Single Source of Truth)](#data-source-single-source-of-truth)
- [Styling (src/index.css)](#styling-srcindexcss)
- [Assets](#assets)
- [Configuration](#configuration)
- [Scripts & Development](#scripts--development)
- [Deployment & Env](#deployment--env)
- [Accessibility & Performance](#accessibility--performance)
- [Future Ideas (not yet implemented)](#future-ideas-not-yet-implemented)

---

## Overview

Single-page portfolio for **Robb Jullian Haaiah P. Olazo** — Aspiring Web Developer (Full-Stack / Backend / UI/UX), Philippines, 2026. Built end-to-end, mobile-first, fixed glass navbar + stacked sections. Highlights 6 shipped projects, 7 certificates/awards, skills, and a Gemini-powered floating assistant that answers *as Robb* in first person with strict English vs. conyo routing.

- **Entry**: `index.html` → `src/main.jsx` → `src/App.jsx`
- **No router** — single page with hash navigation (`#about`, `#skills`, `#projects`, `#certificates`, `#contact`, `#top`) + smooth scroll with live header offset.
- **Fonts** (Google Fonts): `DM Serif Display` (hero display, italic), `Syne`/`Space Grotesk` (display), `Inter` (body), `JetBrains Mono` (mono).

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| **Framework** | `react@19.2`, `react-dom@19.2` | Vite plugin ` @vitejs/plugin-react@6` (Oxc) |
| **Build** | `vite@8.2` | `tailwindcss@4.3` via `@tailwindcss/vite`, `manualChunks` for `react` + `three`, `chunkSizeWarningLimit: 3300`, `.glb` as asset |
| **Styling** | `tailwindcss@4.3`, `@import "tailwindcss"` + `@theme` CSS vars, `autoprefixer`, `postcss` | B&W tokens in `src/index.css` |
| **3D / Physics** | `three@0.185`, `@react-three/fiber@9.7`, `@react-three/drei@10.7`, `@react-three/rapier@2.2`, `meshline@3.3` | Lanyard band + card, `Environment` + `Lightformer` |
| **Icons** | `lucide-react@1.35` | Nav, projects, chat, certs |
| **AI** | `@google/genai@2.19` | Gemini wrapper in `src/lib/gemini.js` |
| **Lint** | `oxlint@1.79` | `npm run lint` |
| **Fonts** | Google Fonts (preconnect) | DM Serif, Syne, Space Grotesk, Inter, JetBrains Mono |

---

## Project Structure

```
/
├── index.html                 # SEO meta, theme bootstrap script, font links
├── vite.config.js             # react + tailwindcss plugins, manualChunks, optimizeDeps
├── .oxlintrc.json
├── public/
│   ├── favicon.svg, new-logo.svg, logo-dark.svg, logo-light.svg
│   ├── profpic.png, lightmode.png, normal.png, bandw*.png
│   ├── systems/               # Project screenshots (5 pngs)
│   │   ├── adlaon-web.png
│   │   ├── kubohub.png
│   │   ├── brewtiful-u-pos.png
│   │   ├── brewtiful-u-web.png
│   │   └── dry-goods-web.png
│   └── awards-and-certs/      # 7 cert images
├── src/
│   ├── main.jsx               # React root
│   ├── App.jsx                # Shell: Nav + Hero + main(About,Skills,Projects,Certificates,Contact) + Footer + FloatingChat + FloatingOrbs + Marquee
│   ├── index.css              # Tokens, theme, glass, scrollbar, tilt/scramble/toast, reveal
│   ├── assets/
│   │   ├── card.glb           # Lanyard card geometry
│   │   └── lanyard.png        # Band texture
│   ├── components/
│   │   ├── Nav.jsx            # Glass nav, pill, progress, scroll-spy, theme toggle
│   │   ├── Hero.jsx           # Availability badge + headline + lanyard (desktop), CTAs, bottom bar
│   │   ├── Lanyard.jsx        # Canvas + Physics Band (Rapier) + flip + easter egg
│   │   ├── About.jsx          # Identity glass card, photo, traits, specializations
│   │   ├── Skills.jsx         # Grouped skill grid with ink-fill hover
│   │   ├── Projects.jsx       # Grid/List archive, tilt, modal (hero + two-col), private/live routing
│   │   ├── Certificates.jsx   # 7 cards, placeholder → image on hover, verify link
│   │   ├── Contact.jsx        # (form/info — inferred from App)
│   │   ├── Footer.jsx
│   │   ├── Marquee.jsx        # Scrolling tech ticker
│   │   ├── FloatingOrbs.jsx   # 3 blurred drifting orbs (decor, fixed)
│   │   ├── FloatingChat.jsx   # Gemini chat FAB + sheet/dialog, Quick replies
│   │   ├── ScrambleText.jsx   # Reusable scramble wrapper
│   │   └── Particles.jsx      # (unused / decorative)
│   ├── hooks/
│   │   ├── useTheme.jsx       # isDark, toggleTheme (localStorage + prefers-color-scheme + ViewTransition clip-path)
│   │   ├── useReveal.js       # IntersectionObserver + MutationObserver for [data-reveal].reveal → is-visible
│   │   ├── useTilt.js         # Tilt: max 6°, glare radial, disabled on reduced-motion / hover:none / <640px
│   │   └── useScramble.js     # 420ms decode, STAGGER 22ms, charset A-Z0-9—·•+— 
│   ├── lib/
│   │   └── gemini.js          # sendMessageToGemini({message,history}), hasGeminiKey(), env VITE_GEMINI_API_KEY
│   └── data/
│       └── portfolioContext.js # PORTFOLIO_CONTEXT (system prompt, SSoT for AI) + SYSTEM_PROMPT export
└── dist/                      # Build output (vite)
```

---

## Routing & App Shell

- **`src/App.jsx:15`** — `useReveal` scope + `useTheme` shell. Renders:
  ```jsx
  <FloatingOrbs />
  <Nav isDark toggleTheme />
  <Hero />
  <main><Marquee/><About/><Skills/><Projects/><Certificates/><Contact/></main>
  <Footer />
  <FloatingChat />
  ```
- **Hash nav** — `Nav.jsx:22 handleNavClick` + delegated `document` click handler `Nav.jsx:92` compute live `headerRef.offsetHeight` + `+ window.scrollY - headerH - 8` and `history.pushState`. Covers Hero CTAs, About "Let's talk", etc.
- **`index.html:16` inline script** — reads `localStorage.theme` else `prefers-color-scheme`, adds `class="theme-dark"` to `html`, sets `colorScheme`.
- **`html { scroll-padding-top: 72/80px }`** + JS offset ensures fixed header never covers section border.

---

## Sections & Content

### Hero (`src/components/Hero.jsx:29`)
- Full `min-h-[100dvh]` flex column, dot-grid `radial-gradient(var(--ghost))` masked `ellipse 70% 60%`.
- **Left**: Availability badge (`ScrambleText: "Available for work"`), `h1 Robb / Olazo` (`DM Serif Display`, `clamp(3.75rem,18vw,10.5rem)`), role pills `Backend · UX · Full-Stack`, bio, CTAs `View Projects →` (ink) + `Get in touch` (ghost).
- **Right (md+)**: `<Lanyard position={[0,0,22]} gravity={[0,-40,0]} frontImage="/new-logo.svg">` inside `Suspense`, `pt-24 md:pt-36`.
- **Bottom bar**: `2026 — PH` + mobile `Scroll ↓` bounce.

### About (`src/components/About.jsx:106`)
- 3-row glass stack on `bg-paper`:
  1. **Identity card** `.about-glass` — photo slot `isDark ? /normal.png : /lightmode.png` fallback placeholder pattern, name `Robb Olazo / Aspiring Web Developer`, bio, `How I work` 4 traits.
  2. **Specializations** grid (3) — `SpecCard` with `asc-active` (ink bg on hover/focus).
  3. **Goal strip** — internship tagline + `Let's talk →` to `#contact`.

### Skills (`src/components/Skills.jsx:22`)
- `min-h-[100dvh]` with header `Tools I reach for.` + 2-col groups:
  - Languages (8), Frameworks & UI (5), Backend & Data (3), Tools & Workflow (3)
- Each `.skill-item` uses absolute `.skill-fill` `scaleX(0)→1` (GPU only) + `.skill-name translateX(6px)` + `.skill-mark` reveal on hover/focus.

### Projects (`src/components/Projects.jsx:14`)
- **6 projects** (id, number, title, category, year, role, description, longDescription, tags, href/liveUrl, mock, image, highlights):
  1. `optical` 01 Commerce 2025 Full-Stack — HTML/CSS/JS/PHP/MySQL — `/systems/adlaon-web.png` — `href:null` (private)
  2. `kubohub` 02 Platform 2025 Full-Stack — React/Node/Tailwind/Firebase/PayPal — `/systems/kubohub.png` — `href: github/kubohub` + `liveUrl: https://kubohub.web.app`
  3. `brewtiful` 03 Systems 2026 Desktop — React/Vite/Tailwind/Electron/Supabase/SQLite/Node — `/systems/brewtiful-u-pos.png` — `href:null` (private)
  4. `brewtiful-2` 04 Booking 2026 — React/Vite/Tailwind/Supabase — `/systems/brewtiful-u-web.png` — `href: brewtiful-u-booking` (public)
  5. `abella` 05 Sales & Inventory 2026 — Electron/SQLite — `image:null` (coming soon) — `href:null` (private)
  6. `abella-web` 06 Order Mgmt 2026 — React/Supabase — `/systems/dry-goods-web.png` — `href: abella-web` (public)
- **Grid/List** toggle `view` (`LayoutGrid`/`List`), `hoveredId` state.
- **Preview** (`ProjectPreview`) — top bar `year — category | role`, image with `scale-[1.03]` + ghost `number` + `View →` pill (always on mobile, hover on desktop).
- **Modal** (`selected`, `closing`, `selectedIndex`, `goPrev/Next`, `ArrowLeft/Right`, `Escape`, `body overflow hidden`, focus `closeBtnRef`) — backdrop `blur(10px)`, hero `ProjectMedia` (shimmer until loaded), corner `Fig n` + conditional chips `Live` / `GitHub`, overlay arrows, body two-col `[1.55fr_1fr]` left narrative + right highlights/stack/links. Footer prev/next dots. Private projects show dashed `Private project — no public repo`.

### Certificates (`src/components/Certificates.jsx:4`)
- **7 items**: Gold Gear 24-25, Gold Gear 25-26, Cisco Packet Tracer, Brewtiful-U Deployment, JA Financial Literacy, JA Project Management, JA Sales & Strategy. All have `image` in `/awards-and-certs/`. `CertThumb` fades placeholder → image on hover. Tags `Tech`/`Business` + `Award`/`Certificate`. Single grid, no filter, hover lifts `translateY(-3px)`.

### Contact / Footer / Marquee
- `Contact.jsx` (form/info + socials) → scroll target `#contact`; `Footer.jsx` site footer; `Marquee.jsx` 20s `marquee-scroll` infinite loop ticker (honors reduced-motion).

---

## Features

### 1. Design System (B&W Minimalist + Glassmorphism)

**Tokens** `src/index.css:3` (`@theme`):
```
--color-ink: #0d0d0d   --color-paper: #ffffff   --color-panel: #fafafa
--color-muted: #6e6e6e  --color-faint: #a8a8a8   --color-ghost: #e7e7e7
--color-line: #e0e0e0   --font-display: Syne/Space Grotesk
--font-body: Inter  --font-mono: JetBrains Mono
.theme-dark: --ink #fff, --paper #0d0d0d, --panel #1a1a1a, --line #333, --muted #a3a3a3
```
**Glass** `src/index.css:136` — light emphasized: `.nav-glass` `rgba(255,255,255,0.36) blur(24px) saturate(195%) contrast(1.04)` + double specular `linear+radial` `::before` + inset highlights + tinted shadow `rgba(31,38,135,0.08)`. `.nav-glass-scrolled` `0.52/20px/185%`, `.nav-pill` `0.50/16px`, `.mobile-drawer` `0.58/24px`, `.theme-toggle` `0.48/14px`, `.about-glass`, `.chat-fab/panel` similarly. Dark overrides are flatter `rgba(18,18,18,0.68)` + `0.08` white border.

**Typography**: outlined ghost (`-webkit-text-stroke`), mono labels `tracking-[0.15–0.2em] uppercase text-faint`, display `font-semibold tracking-[-0.02em]`.

### 2. Theme (Light/Dark)

- `src/hooks/useTheme.jsx` — `isDark` from `localStorage.theme` or `prefers-color-scheme`, `toggleTheme(e)` does ViewTransition clip-path wash (`::view-transition-old/new` `src/index.css:45` set `animation:none`, z-index 1/9999) centered on click coords, else instant fallback. Applies `class="theme-dark"` to `html`.
- Zero-lag: no per-element `background/color` transitions — swap via CSS vars; `will-change: transform` on toggle.
- `theme-toggle` `src/index.css:375` rotates 8° scale 1.07 on hover, pulse ring `::after` `scale(1.25)→1`.
- Bootstrap script in `index.html:16` avoids FOUC.

### 3. Navigation

- `src/components/Nav.jsx` — `fixed top-0 inset-x-0 z-50` `nav-glass` vs `nav-glass-scrolled` (py 3 vs 4, `scrolled >20`). `nav-progress` `scaleX` driven via rAF eased `0.18` `Nav.jsx:40`. `LINKS` 5 items, `active` scroll-spy `rect.top <=120`, `y<200` clears. `pillRef` + `linkRefs` auto-centers active link horizontally on mobile (`scrollBy smooth`). `nav-cta` `Hire me →` with `::before` diagonal sheen `translateX(-120%→120%)`.

### 4. Hero + Lanyard

- Dot-grid + masked hero, `reveal` stagger 0/60/120/180ms.
- **Lanyard** `src/components/Lanyard.jsx:29` — `<Canvas camera position/fov responsive isMobile>` + `<Suspense><Physics gravity timeStep 1/60><Band/><Environment>` (3 `Lightformer`s). `Band` uses `BallCollider` chains + `useRopeJoint` ×3 + `useSphericalJoint` to card, `MeshLineGeometry` band via `CatmullRomCurve3 chordal` (16/32 points). Card `card.glb` composite texture via canvas (`FRONT_UV_RECT/BACK_UV_RECT`, white fill then `drawFitted` 0.48 scale), `meshPhysicalMaterial clearcoat 1 roughness 0.85 metalness 0.5`. Drag via `kinematicPosition` + `pointerCapture`, hover cursor `grab/grabbing`, flip `flipGroupRef rotation.y damp PI`. Mobile recenter `[1.1,1.5,14] fov 26`.

### 5. Projects Archive

- Grid/List, `reveal` 60ms stagger, `proj-card` `border-line` → `border-ink translateY(-2px) shadow` hover (disabled <640). Private routing: only `kubohub`, `brewtiful-2`, `abella-web` expose GitHub; `optical` now shows `/systems/adlaon-web.png` instead of null; `kubohub` adds `Live` chip -> `kubohub.web.app`. Footer hint `GitHub / Live where available`. Modal conditional chips + stacked `Visit live site` (ink) + `View repository` (paper when live exists) else dashed private note.

### 6. Interactivity Layer

- **Tilt** `src/hooks/useTilt.js:1` — `max 6°, scale 1.015`, `perspective(900px) rotateX/Y`, `raf`-throttled `mousemove`, `glare` `radial 300px` `overlay` (soft-light in dark). Disabled `@media (hover:none) | max-width:640px | prefers-reduced-motion`. Wrapped via `TiltCard` `src/components/Projects.jsx:210` inside `.tilt-wrap` (`.tilt-wrap`/`.tilt-glare` `src/index.css:533`).
- **Scramble** `src/hooks/useScramble.js:1` — `DURATION 420ms STAGGER 22ms CHARSET A-Z0-9—·•+—`, `requestAnimationFrame` decode per char, `ref` setter keeps layout. `ScrambleText.jsx:1` reuse, used on Hero `Available for work` `Hero.jsx:66` + Nav `Hire me` `Nav.jsx:189`.
- **Lanyard Easter Egg** `Lanyard.jsx:268` — `dragTimesRef` 4 tugs in 2.5s → `triggerEaster("tug")`, or keys buffer `robb` → `"keys"`. `cooldown 2200ms`, `prefers-reduced-motion` guard, `applyImpulse (14,18,10)` + `applyTorqueImpulse` + double flip `setFlipped` 420ms, band flash `color #0d0d0d` + `lineWidth×1.35` `Lanyard.jsx:476`, `CustomEvent("lanyard:easter")` → outer toast `src/components/Lanyard.jsx:58` (`· caught the tug — nice ·` vs `· you found it — robb ·`) with `lanyard-toast` `toast-in 0.38s + toast-out 0.32s 2.6s` `src/index.css:550`.

### 7. AI Floating Chat

- `src/components/FloatingChat.jsx:82` + `src/lib/gemini.js` + `src/data/portfolioContext.js` (SSoT, 6 projects, skills, certs, contact, strict language). `QUICK_REPLIES` 3 chips, `formatTime` wall-clock, lightweight `**bold**` + `•` bullets. `ProfileAvatar` `/profpic.png` fallback `RO`. States `open`, `input`, `messages` (intro bot), `loading`, `error`, `hasKey`. Focus on open, `Escape` close, mobile `body overflow hidden`, auto-scroll to bottom, `hasGeminiKey` guard, history mapped excluding intro, `sendMessageToGemini` call, error mapping (429/quota/429 code → friendly fallback; API key errors → prompt with `AIza...`). FAB `chat-fab` `58px` glass `blur(16px)` + pulse + dot, panel `390px 560px` `blur(26px)` `scale(0.98)→1`, mobile bottom sheet `translateY(100%)`. Glass panels/bubbles/chips adapt to dark. `renderInline/Message` avoids raw markdown.

**System Prompt** `portfolioContext.js:6` — "You ARE Robb Olazo, first person, never 'assistant'". **Language**: pure English → pure English (default for recruiters), mixed/Tagalog (any particle `uy`, `na`, `kasi`, `pare`, `po`) → Tagalog conyo Taglish (classy, not slangy). Examples embedded.

### 8. Miscellaneous Polish

- **Reveal** `useReveal.js` — `IntersectionObserver` on `[data-reveal]` adds `is-visible` (`opacity 0→1 translateY 16→0 0.7s`), `MutationObserver` watches DOM for newly added nodes (grid/list toggle).
- **FloatingOrbs** `FloatingOrbs.jsx:1` — 3 fixed blurred blobs `300/260/200px` `blur 32px` `opacity 0.14` (dark `white 0.11`), `drift-1/2/3 14/16/18s ease-in-out infinite` with scale jitters, mobile downscales + `blur 24px`.
- **Marquee** `Marquee.jsx` — `marquee-track 20s linear infinite` (disabled in reduced-motion).
- **Scrollbar** `index.css:463` — `thin`, `ink/panel`, `gutter stable`, `8px` webkit thumb `border 2px panel`.
- **Selection, focus** — `::selection ink/paper`, `a:focus-visible 2px ink offset 3px`.
- **Scroll** — `smooth` + `scroll-padding-top 72/80px` + `scroll-margin-top` fallbacks.

---

## Components Reference

| File | Export | Props / Key State |
|------|--------|-------------------|
| `Nav.jsx` | `Nav({isDark,toggleTheme})` | `scrolled, active, progressRef/headerRef/pillRef/linkRefs, handleNavClick` |
| `Hero.jsx` | `Hero({className})` | `isMobile (rAF debounce resize), Lanyard lazy` |
| `Lanyard.jsx` | `Lanyard({position,gravity,fov,transparent,frontImage,backImage,lanyardWidth,…})` + `Band` | `isMobile, activePosition/Fov, toast; Band: drilled/hovered/flipped, dragTimes/keyBuf, easterFlash` |
| `About.jsx` | `About({isDark})` | `hoveredSpec, SPECIALIZATIONS×3, TRAITS×4, GlassCard/SpecCard` |
| `Skills.jsx` | `Skills()` | `GROUPS×4 (23 items), skill-fill/skill-name/skill-mark` |
| `Projects.jsx` | `Projects()` | `PROJECTS×6, view, hoveredId, selected/closing, selectedProject/Index, TiltCard, ProjectPreview/Media, view-toggle, modal` |
| `Certificates.jsx` | `Certificates()` | `CERTIFICATES×7, hoveredId, CertThumb, cert-card` |
| `FloatingChat.jsx` | `FloatingChat()` | `open, input, messages, loading, error, hasKey, QUICK_REPLIES×3` |
| `ScrambleText.jsx` | `ScrambleText({text,as,className})` | `useScramble(text)` |
| `FloatingOrbs.jsx` | `FloatingOrbs()` | static 3 orbs |
| `Marquee.jsx` | `Marquee()` | ticker track |
| `Footer.jsx` | `Footer()` | site footer |
| `Contact.jsx` | `Contact()` | form/info (hash target) |

---

## Hooks & Libs

- **`useReveal.js`** — returns `scopeRef`; observes `[data-reveal]` inside, toggles `.is-visible`, MutationObserver for dynamic nodes.
- **`useTheme.jsx`** — returns `{isDark, toggleTheme(e)}`; localStorage + `matchMedia`, ViewTransition `document.startViewTransition` clip-path.
- **`useTilt.js`** — returns `{ref, glareRef, onMove, onEnter, onLeave}`; disabled checks, `raf` update, `radial-gradient` glare.
- **`useScramble.js`** — returns `{ref: setRef, onEnter, onLeave}`; `raf` 420ms stagger decode.
- **`lib/gemini.js`** — `hasGeminiKey() => !!VITE_GEMINI_API_KEY`, `sendMessageToGemini({message,history})` builds Gemini payload with `PORTFOLIO_CONTEXT` system instruction, handles 429/quota/network fallbacks, throws `API_KEY_INVALID` etc.

---

## Data Source (Single Source of Truth)

**`src/data/portfolioContext.js:6 PORTFOLIO_CONTEXT`** — Injected as Gemini system prompt (`export const SYSTEM_PROMPT`). Contains:

- Identity: "You ARE Robb Olazo, first person I/my/me", who-are-you answer, Bio (builds web apps end-to-end), How he works 01-04, Specializations, internship intent, Availability freelance & full-time, Education (St. Mary's BIS, Immaculate Conception HS, BSU Bustos).
- Contact: `robbolazo.dev@gmail.com`, `github.com/Robb730`, `linkedin/.../8b6a433bb` (only share when asked).
- Skills: JS/TS/HTML/CSS/Python/SQL/Java + React19/Next15/Three/Tailwind/Node/Express + Git/CI/CD/Figma/Docker/PostgreSQL/Prisma/FastAPI/Vercel/REST/GraphQL + project extras PHP/MySQL/Firebase/PayPal/Electron/SQLite/Supabase/Vite.
- Projects 01-06 (one-liners, see Projects section).
- Certs/Awards 7 items 2024-2026 (Gold Gear×2, Cisco, Brewtiful-U Deployment, JA×3).
- Instructions: never break character, concise 3-4 sentences, no hallucinations, decline off-scope, suggest portfolio section, no forced CTA.
- Language: pure English → pure English; mixed/Tagalog → conyo (examples, classy only, `CRITICAL: Pure English = pure English. Mixed = conyo.`).

---

## Styling (`src/index.css`)

- `@import "tailwindcss"; @theme` tokens + body `bg-paper text-ink font-body`.
- `::view-transition`, `::selection`, `.text-outline`, `.reveal`, `.theme-dark` vars, `.placeholder-pattern` (135deg 1px ghost), `.dot-pulse 2s`, focus outline, glass blocks (`.nav-glass`, `.nav-pill`, `.mobile-drawer`, `.theme-toggle`), scrollbar, `marquee-track 20s`, reduced-motion overrides (`animation none`), `scroll-margin-top`, `.tilt-wrap/.tilt-glare`, `.scramble`, `.lanyard-toast` + `toast-in/out`.

---

## Assets

- **Brand**: `/new-logo.svg` (lanyard card), `/logo-dark.svg` / `/logo-light.svg` (nav swaps on `isDark`), `/favicon.svg`.
- **Photos**: `/lightmode.png` (light), `/normal.png` (dark) for About, fallback placeholder; `/profpic.png` for chat avatar, `/pose1.png`, `/ROB1.jpeg`, `/bandw*.png`.
- **Systems**: `systems/*.png` (5 used + `dry-goods` + `adlaon-web.png` now wired; `abella` desktop still `null` placeholder).
- **Certs**: `awards-and-certs/*.png` (7).
- **3D**: `src/assets/card.glb` (card), `lanyard.png` (band texture).
- Financing: Vite resolves `assetsInclude: **/*.glb` and copies public assets as-is.

---

## Configuration

- **`vite.config.js:6`** — `plugins: [react(), tailwindcss()]`, `assetsInclude ["**/*.glb"]`, `chunkSizeWarningLimit 3300`, `manualChunks` (`react` vs `three`), `optimizeDeps include react,dom,three`.
- **`index.html:6`** — `lang en`, `viewport max 5.0`, `theme-color #ffffff`, `description`, fonts `DM Serif Display`, `Syne`, `Space Grotesk`, `Inter`, `JetBrains` + bootstrap theme script.
- **`.oxlintrc.json`** — lint rules (implicit), `npm run lint`.

---

## Scripts & Development

```bash
npm install
npm run dev      # vite (HMR, pre-bundles react/three)
npm run build    # vite build → dist/ (gzip sizes: index.css ~10.6k, index.js ~92k, three ~1.1M, card.glb 2.4M, lanyard png 7.5k)
npm run preview  # serve dist
npm run lint     # oxlint
```

- Dev: `FloatingOrbs` fixed behind, `Marquee` under Hero, `Nav` fixed, sections `border-t border-line`.
- Reveal: add `data-reveal class="reveal"` to animate (`useReveal` scope covers whole app via `App.jsx:20 ref={scopeRef}`).
- Theme toggle: pass `toggleTheme` from `useTheme` into `Nav`.

---

## Deployment & Env

- **Static** — `dist/` deploy to Vercel/Netlify/any static host; `public/` copied as root.
- **AI Chat** — requires `VITE_GEMINI_API_KEY=AIza...` in `.env.local` (`hasGeminiKey` check, friendly "Missing API key" panel + `Invalid API key` hint to `aistudio.google.com/app/apikey`). Without key, chat shows placeholder + disabled input. Handles quota 429 with `Hi! I'm sorry if I'm unable…` fallback + no red error bar.
- **Live demos**: only KuboHub has `https://kubohub.web.app` wired; other 3 private projects hide GitHub entirely (see Projects private routing).

---

## Accessibility & Performance

- `prefers-reduced-motion: reduce` disables marquee, reveal transitions, tilt/glare, lanyard easter impulse, chat pulse, orbs animation (falls to `0.001ms`).
- Keyboard: `focus-visible 2px ink`, `Enter/Shift+Enter` to send chat, `Escape` closes chat/modal, modal prev/next via `ArrowLeft/Right` + focus trapping `closeBtnRef`, `tabIndex 0` on skill items, `aria-label`/`aria-expanded` on FAB/dialog.
- Mobile: bottom-sheet chat with `env(safe-area-inset-*)`, `body overflow hidden` on sheet/modal, `scrollbar-none` pills, `overflow-wrap anywhere` on chat bubbles, `maxWidth 100vw -24px`.
- Perf: `will-change: transform` on progress/theme-toggle/skill-fill/tilt-wrap, `transform: scaleX/translateY/scale` GPU-only, Rapier `timeStep 1/60 solver 8`, `dpr [1,2]`, `manualChunks` splits three, `optimizeDeps` pre-bundle, `Math.min(delta,1/30)` clamp after tab switch, `onCreated gl.clearColor alpha`.

---

## Future Ideas (not yet implemented)

- **Cmd+K command palette** (search sections/projects)
- **Magnetic Hire Me** cursor pull
- **Copy-email confetti**
- **Reading progress dots** per project
- **Custom ink cursor** (`mix-blend-mode: difference`)
- **Availability presence** (`PH 2:34 PM` live timezone)
- **Resume preview hover** + shareable `#project` deep links

---

*Generated for portfolio `C:\Users\Robb\Documents\projects\portfolio` — `package.json@0.0.0`. Theme: B&W minimalist clean aesthetic; interactions low-risk & polished.*
