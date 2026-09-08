---
version: alpha
name: NotionIQ Master Design System (Monochrome)
description: >
  A strict black-and-white dark-mode design language modeled on Vercel's Geist
  system, inverted to dark, with Linear's surface ladder for depth. NO chromatic
  accent color anywhere — no blue, no violet, no gradient hues. All depth, hierarchy,
  and emphasis comes from grayscale value alone: near-black canvas, white ink,
  and a stepped gray ladder in between. Buttons are white-on-black or black-on-white,
  never colored.

colors:
  canvas: "#0a0a0a"
  surface-1: "#121212"
  surface-2: "#191919"
  surface-3: "#222222"
  hairline: "#2a2a2a"
  hairline-strong: "#3a3a3a"
  ink: "#fafafa"
  ink-secondary: "#b0b0b0"
  ink-muted: "#7a7a7a"
  ink-faint: "#525252"
  white: "#ffffff"
  black: "#000000"
  error: "#e5484d"
  success: "#3dd68c"

typography:
  display-xl:
    fontFamily: Inter, Geist, ui-sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 48px
    letterSpacing: -2.4px
  heading-lg:
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -1.28px
  heading-md:
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.4px
  eyebrow:
    fontFamily: "JetBrains Mono, ui-monospace"
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.05em
    textTransform: uppercase
  body-lg:
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm:
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  button:
    fontSize: 15px
    fontWeight: 500
    lineHeight: 20px
  mono:
    fontFamily: "JetBrains Mono, ui-monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px

rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 16px
  pill: 100px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 64px
  4xl: 96px
  section: 128px
---

## Core rule
No color, ever, outside grayscale. No accent blue, no gradient hues, no colored glow. The ONLY exceptions are `error` (#e5484d) for validation and `success` (#3dd68c) for correct-answer states in the quiz — nowhere else.

## Elevation & Depth (grayscale ladder, no color)

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | canvas, no border | Body background |
| 1 — Lift | surface-1, 1px hairline border | Default cards, inputs |
| 2 — Elevated | surface-2, hairline-strong border, faint white-on-white top-edge highlight | Featured cards, hero content box |
| 3 — Floating | surface-3, layered neutral (black) shadow stack | Modals, dropdowns |

### Card technique (grayscale glassmorphism — no color tint)
```css
.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}
.card:hover { border-color: var(--hairline-strong); }
```
For a featured/elevated card only, add a subtle white gradient-border pseudo-element (not colored):
```css
.card-featured::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

### Buttons — two shapes, monochrome only
**Primary (marketing CTA)** — white fill, black text, fully-rounded pill:
```css
.cta-button {
  background: var(--white);
  color: var(--black);
  border-radius: var(--radius-pill);
  padding: 0 24px;
  height: 44px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.cta-button:hover { transform: scale(1.02); opacity: 0.9; }
```
**Secondary (nav/app)** — transparent/surface fill, white text, tight square:
```css
.btn-secondary {
  background: var(--surface-1);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 0 14px;
  height: 36px;
}
.btn-secondary:hover { border-color: var(--hairline-strong); background: var(--surface-2); }
```

### Hero glow — grayscale only
```css
.hero-glow-backdrop {
  position: absolute;
  width: 800px;
  height: 500px;
  left: 50%;
  top: -100px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}
```

## Typography rules
- Geist Sans / Inter, weight 600 headings with tight negative tracking (-2.4px at hero/display-xl scale) — this precision is what reads as premium, not raw boldness.
- Weight 400 body only. No light/black weights, no italics.
- JetBrains Mono reserved for uppercase eyebrow labels and code/AI-output blocks only.

## Do's and Don'ts

### Do
- Use only grayscale values (canvas → surface-1 → surface-2 → surface-3 → hairline → ink ladder) for every visual decision.
- Let a 1px hairline border be the default depth cue; layer glassmorphism/blur as an enhancement on featured cards only.
- Use white-fill pill buttons for marketing CTAs, dark bordered square buttons for nav/app chrome.
- Keep display type tightly tracked negative; body neutral.
- Use error red / success green ONLY for quiz correctness states and form validation — nowhere else.

### Don't
- Don't introduce any blue, violet, purple, pink, or gradient hue anywhere.
- Don't fill large surfaces with pure white or pure black — use the surface ladder.
- Don't use emoji as illustration — inline SVG line-art (stroke, monochrome) only.
- Don't use external image/texture URLs.
- Don't round every button the same amount — pills for CTAs, 6px squares for nav/app.