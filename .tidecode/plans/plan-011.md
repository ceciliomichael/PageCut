---
status: draft
---

# Mobile live preview workspace

Goal: make the shared live-preview editor feel purpose-built on phones across all six tools.

Findings: the current lg desktop grid simply stacks on mobile, but the preview keeps a desktop min-height of 560px and both settings/preview retain nested scrolling. PageShell also reserves desktop-like vertical spacing.

Implementation: keep desktop behavior unchanged from lg upward. On mobile, let the workspace itself be the main scroller, make settings content natural-height, use a sticky action bar while the settings section is in view, compact the editor header/file summary, and give the preview a dedicated ~64dvh bounded-height panel with its own document scroll. Tighten preview headers/page gutters/shadows for narrow screens. Apply the same sizing to PDF and image previews. Slightly reduce wide PageShell mobile spacing so more viewport is available.

Dependencies: none.

Verification: Biome on shared components, production build/TypeScript, git diff --check, and render at least one editor at a phone-size viewport for visual inspection. Preserve desktop classes at lg and all processing behavior.
