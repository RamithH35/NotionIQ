# AGENTS.md — NotionIQ Frontend Build Instructions

## Stack
- Astro + Tailwind 4. Use the installed "astro js tailwind 4 docs" and "web design guidelines" skills for correct syntax/conventions — don't guess at Tailwind 4 or Astro APIs from memory, check the skill docs.
- Runtime must start with `npm start` (or `npm run dev` if that's the Astro convention — confirm which and document it in README, but there must be ONE documented command, not multiple).

## Design file hierarchy — read in this order, resolve conflicts this way

1. **DESIGN.md is authoritative and final.** It is strict black/white/grayscale — no accent colors. Every color decision comes from this file. Full stop.
2. **DESIGN-VERCEL.md and DESIGN-LINEAR.md are structural/typographic references only.** Pull from them:
   - Vercel: typography scale, tight negative letter-spacing values, spacing scale (4px base), pill-vs-square button shape logic, hairline-border-as-default-depth philosophy, section rhythm/whitespace discipline.
   - Linear: the four-level dark surface ladder (canvas → surface-1 → surface-2 → surface-3), restraint around decoration, "product screenshot as protagonist" instinct (adapt this to "AI output panel as protagonist" for NotionIQ).
3. **Ignore every color value in DESIGN-VERCEL.md and DESIGN-LINEAR.md.** Their blue/violet/cyan/pink accents do not apply here. If a component spec in either file references a colored token (e.g. `{colors.link}`, `{colors.primary}` lavender), substitute the equivalent grayscale token from DESIGN.md instead (e.g. white or ink, not blue).

## Synthesis instruction
You are not choosing one file over the others wholesale — you are building **Vercel's precision and Linear's dark discipline, executed in pure grayscale per DESIGN.md**. Concretely:
- Layout rhythm, grid, and typography tracking → follow Vercel's numbers.
- Surface/elevation system and "let the dark canvas be the whitespace" philosophy → follow Linear's structure.
- Every actual color/fill/border value → follow DESIGN.md only.

Where the reference files disagree on non-color specifics (e.g. Vercel's 1200px container vs Linear's 1280px), default to Linear's number since NotionIQ's dark-canvas-as-whitespace approach is closer to Linear's model — but this is a minor call, use judgment.

## Non-negotiables
- No color anywhere except DESIGN.md's grayscale ladder, plus error red / success green for quiz correctness and form validation only.
- No emoji — inline SVG line-art only.
- No external image/texture URLs.
- Reuse one shared button/card/nav component system across every page — no one-off styles per route.
- Every interactive element needs a hover state.

## Before declaring any phase done
State explicitly which file supplied which decision (e.g. "spacing scale from Vercel, surface ladder from Linear, all color values from DESIGN.md") so it's auditable, then confirm visually that no non-grayscale color leaked in anywhere.