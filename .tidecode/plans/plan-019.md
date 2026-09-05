---
status: draft
---

# Four-corner signature resize handles

Goal: Replace the single bottom-right signature resize dot with a normal four-corner resize box.

Changes:
- Add NW, NE, SW, SE resize gestures to the shared Sign PDF live overlay.
- Preserve aspect ratio while resizing and anchor the opposite corner.
- Clamp resized signatures to the PDF page.
- Add a visible selection border and four corner handles for typed, drawn, and uploaded signatures.
- Keep move behavior and final normalized placement format unchanged.

Verification:
- Targeted Biome check.
- TypeScript noEmit.
- git diff --check.
- Production build.

Scope: Sign PDF resize interaction only; no new dependencies.
