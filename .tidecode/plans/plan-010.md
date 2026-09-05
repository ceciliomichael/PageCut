---
status: draft
---

# Align home card footers

Goal: align the footer/meta row at the same vertical position across every home tool card.

Finding: the cards live in src/app/page.tsx and have different description lengths, so the divider/footer naturally moves.

Change: make each card content a full-height flex column and push the divider/footer block to the bottom with auto margin. Keep existing copy, card heights, routes, and styling otherwise unchanged.

Verification: Biome on src/app/page.tsx, production build/TypeScript, and git diff --check. No dependencies or unrelated changes.
