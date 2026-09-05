---
status: draft
---

# Core PDF editing tools

Goal: add three standard PDF tools inspired by common competitor capabilities while preserving PageCut's own design: Organize PDF (reorder/remove/rotate pages), Add Page Numbers, and Add Watermark.

Implementation: reuse the existing PageShell/StepBar three-step flow and pdf-lib; keep all processing in-browser; add home cards and dedicated routes/components; use in-memory sessions; do not add artificial file/page limits; do not copy competitor UI/copy.

Verification: targeted Biome check for touched files, production Next.js build, and git diff --check.

Scope: no OCR, compression, Office conversion, signing, or cloud storage in this batch; no new dependencies unless required by existing architecture.
