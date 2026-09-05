---
status: draft
---

# Crop handles on page edge

Goal: keep crop handles centered exactly on the crop boundary, including when that boundary is the PDF page edge.

Changes:
- Restore half-outside corner handle positioning.
- Allow overlay overflow only for Crop preview pages so handles are not clipped by the page wrapper.
- Keep all non-Crop previews clipped as before.
- Preserve current z-index ordering with crop controls above the canvas.

Verification:
- Run Biome on the edited preview component.
- Run TypeScript and git diff --check.

Scope: crop-preview positioning/stacking only.
