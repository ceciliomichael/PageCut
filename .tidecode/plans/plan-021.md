---
status: draft
---

# Fix image extraction and remove redundant tools

Goal: extract all supported embedded raster images from the supplied PDF, and remove standalone Delete Pages / Rotate PDF because Organize already provides those actions.

Changes:
- Diagnose page 2 image object shapes in C:\Users\Admin\Downloads\BSIT-MI_Cecilio-Michael-organized.pdf and fix raster conversion so both images survive.
- Keep current timeout/progress resilience.
- Delete Delete Pages and Rotate PDF routes/components.
- Remove their homepage cards, session types/defaults, processing functions/dispatcher branches, upload/results mappings, PageShell/StepBar modes, and preview-only branches.
- Preserve Organize PDF delete/rotate behavior.

Verification:
- Re-test exact PDF image objects and expected extracted count.
- Search for stale delete-pages/rotate feature references.
- Biome, TypeScript, git diff --check, production build.

No new dependencies.
