---
status: draft
---

# Image to PDF

Goal: add a browser-only Image to PDF tool matching PageCut's existing three-step flows.

Changes:
- Add a home mode card and /image-to-pdf routes for Upload, Organize, and Convert.
- Extend PageShell/StepBar with an image-to-pdf mode.
- Add an in-memory image session, image validation/dimension reading, ordering/output filename UI, and pdf-lib conversion with one image per page.
- Support JPEG, PNG, and WebP, keep all processing local, and handle invalid/unreadable images cleanly.
- Reuse existing styling and controls, no new dependency.

Verification: run Biome lint and Next production build, then fix any reported issues.

Scope: no unrelated refactors or extra PDF/image features.
