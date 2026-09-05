---
status: draft
---

# PDF export, crop, and image watermark

Goal: add the next three recommended PageCut features end to end: PDF to JPG/PNG, Crop PDF, and Image Watermark.

1) PDF to JPG/PNG: add a dedicated in-memory conversion session and /pdf-to-image upload/configure/results routes. Configure supports JPG or PNG, JPG quality, render scale, and from/to page range. Reuse the existing PDF.js document renderer for a stable live source preview. Results render selected pages locally to image blobs and provide individual downloads plus a Download all action without artificial PageCut caps. No server upload.

2) Crop PDF: extend PdfUtilityKind/session/processing with crop options stored as normalized margins. Add /crop upload/configure/results routes using the existing shared PDF upload/results components. Configure uses the shared editor, numeric percentage margins, reset, and a draggable/resizable live crop rectangle shown across pages. Apply the same crop box to every page with pdf-lib setCropBox, preserving vector content.

3) Image Watermark: extend the existing watermark options to support text or image mode. Add an image picker for JPG/PNG/WebP, scale, opacity, rotation, and existing top/center/bottom placement. Live preview uses a local blob overlay, and final output embeds the chosen image with pdf-lib. Existing text watermark behavior remains unchanged.

Shared integration: add PageShell/StepBar modes, home cards with aligned footers, reuse the mobile Setup/Preview tabs, keep processing browser-local, and avoid unrelated changes.

Verification: targeted Biome, production Next.js build/TypeScript, git diff --check, route/mode search, and inspect final diff/status. No new dependency unless an implementation blocker is discovered.
