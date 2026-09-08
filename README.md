# NotionIQ — Intelligent Document Synthesis & Active Recall Workspace

A strict black-and-white, high-precision developer and knowledge worker web application built with **Astro** and **Tailwind CSS v4**.

Modeled on the typography and component discipline of **Vercel's Geist system**, inverted to dark mode, and utilizing **Linear's 4-level dark surface ladder** with hairline borders for structural depth.

---

## ⚡ Quick Start

Boot the entire application locally with the single documented command:

```bash
npm start
```

This starts the Astro development server (default port `http://localhost:4321`). No other setup or external database configuration is required.

---

## 🎨 Design System Architecture (DESIGN.md)

- **Pure Monochrome Grayscale**: Strict adherence to grayscale elevation (Canvas `#0a0a0a` → Surface-1 `#121212` → Surface-2 `#191919` → Surface-3 `#222222`).
- **Allowed Colors**: Zero chromatic accents anywhere on the application. The ONLY exceptions are error red (`#e5484d`) for input validation and success green (`#3dd68c`) for quiz correctness states.
- **Button Differentiation**:
  - **Marketing CTAs**: White-fill fully-rounded pills (`rounded-[100px]`, `btn-primary-pill`).
  - **Nav & App Chrome**: Dark bordered 6px squares (`rounded-[6px]`, `btn-secondary-square`).
- **Typography**: Geist Sans / Inter for UI copy with tight negative letter-spacing (`-2.4px` on display type); JetBrains Mono for uppercase technical eyebrows and AI output.
- **Depth & Surfaces**: 1px hairline borders (`#2a2a2a` / `#3a3a3a`) + glassmorphism (`backdrop-blur-md`) + white gradient border pseudo-elements on featured cards.

---

## 🧭 Page Architecture & Flows

1. **`/` (Landing Page)**: Hero with grayscale glow backdrop, tight-tracked display headlines, live interactive mockup preview, 3-up glassy feature card grid, 3-step connected pipeline, closing CTA band.
2. **`/about` (Philosophy & Architecture)**: Deep dive into deterministic document grounding, active recall mechanics, and local sandboxing.
3. **`/signin` (Sign In)**: Centered glassy card with live inline validation and redirect to `/workspace`.
4. **`/signup` (Create Workspace)**: Registration card with live validation and immediate `/workspace` redirect.
5. **`/workspace` (Document & AI Workspace)**: Persistent sidebar for source switching, rich markdown document viewer, cognitive synthesis trigger, and streaming monospace typewriter AI response with provider badges.
6. **`/quiz` (Interactive Active Recall Engine)**: Multiple-choice conceptual questions, live hover-lift options, instant correctness feedback in `#3dd68c` / `#e5484d`, dynamic score tracking, and session summary card.

---

## 🛠 Tech Stack

- **Framework**: [Astro v5](https://astro.build/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native `@theme` directives
- **Typography**: Inter & JetBrains Mono (via Google Fonts)
- **Icons**: Inline SVG line-art (Monochrome, no external assets or emoji)
