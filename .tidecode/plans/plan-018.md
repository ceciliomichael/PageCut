---
status: draft
---

# Five new PDF tools

Goal: implement Sign PDF, Extract Images, Resize PDF, Delete Pages, and Rotate PDF end to end using existing PageCut upload/configure/live-preview/results conventions.

Implementation:
- Extend shared step/header and homepage tool catalog for all five tools.
- Add dedicated sessions/processors where state/output differs; reuse the PDF utility session/processor for page-level operations when clean.
- Sign PDF: support typed, drawn, and uploaded signatures; page selection; draggable/resizable placement; embed into final PDF locally.
- Extract Images: inspect PDF.js image paint operations, collect embedded raster images that can be decoded in-browser, show results with dimensions/page, individual downloads and a browser-safe download-all flow without server upload.
- Resize PDF: presets plus custom dimensions and fit/fill/center modes; live preview representation and pdf-lib output.
- Delete Pages: standalone page selection, keep-at-least-one validation, live deleted-page state, pdf-lib copy output.
- Rotate PDF: standalone per-page and rotate-all controls with stable canvas preview, pdf-lib output.
- Preserve all existing local-processing behavior and mobile Setup/Preview tabs. No unrelated refactors.

Verification:
- Targeted Biome for touched TS/TSX files.
- TypeScript noEmit.
- git diff --check.
- Production Next build if Windows worker resources allow; report environmental failure separately if compilation/typecheck pass.
- Search route/mode/session mappings for omissions.
