---
status: draft
---

# Lossless PDF images and tighter crop

Goal: make PDF-to-image lossless, remove live preview page borders, and allow much tighter crops.

Changes:
- Make PDF-to-image PNG-only, remove JPEG/quality state and UI, keep resolution and page range controls. PNG encoding is lossless; rasterization resolution remains user-selectable.
- Remove the decorative ring/border from rendered live-preview pages while retaining shadow and selection badges.
- Raise crop margin limits from 45% per side / ~12% minimum visible area to 49.5% per side / 1% minimum visible width or height, in drag clamping, numeric inputs, and final PDF validation.
- Keep all processing local and add no dependencies.

Verification: run targeted Biome checks, production build, and git diff --check.
Scope: no unrelated UI or dependency cleanup.
