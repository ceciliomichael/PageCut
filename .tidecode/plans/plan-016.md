---
status: draft
---

# Fix crop overlay stacking

Goal: keep crop borders, corner handles, and the Editing badge above the rendered PDF canvas on every page.

Changes:
- Inspect the live preview page stacking context and crop overlay placement.
- Make the PDF canvas an explicit lower layer and the crop interaction overlay an explicit higher layer without changing crop behavior.
- Keep non-crop overlays and page rendering behavior unchanged.

Verification:
- Run Biome on the edited component.
- Run git diff --check and a targeted TypeScript/build check if the environment allows it.

Scope: styling/stacking fix only, no crop-model or export changes.
