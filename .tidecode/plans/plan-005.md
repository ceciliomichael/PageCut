---
status: draft
---

# Instant overlay preview and unified header

Goal: make Page Numbers and Watermark settings update visually without rebuilding/reloading the PDF, and make the PAGECUT + step-flow header identical across every tool.

Implementation: add Mozilla PDF.js for client-side canvas rendering. Render source PDF pages once, keep those canvases mounted, and draw Page Number/Watermark settings as lightweight DOM overlays that respond instantly to text/opacity/size/rotation/position/range changes. Organize will use the same renderer and only rerender/reflow when page order or rotation actually changes. Final exported PDFs continue using pdf-lib.

Header: keep one shared PageShell/StepBar header and remove width/spacing differences caused by editor mode so split, merge, image-to-PDF, organize, page numbers, and watermark show the same header alignment and flow treatment.

Dependency: add maintained pdfjs-dist for local browser PDF rendering. No PDF data leaves the browser.

Verification: targeted Biome, production build, git diff --check, and status review. Preserve unrelated AGENTS.md edits; package-lock will necessarily gain the pdfjs dependency while retaining its existing local name change.

Scope: preview interaction and shared header only, no new PDF tools.
