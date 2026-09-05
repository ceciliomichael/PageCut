---
status: draft
---

# Fix extract images scan stall

Goal: Make Extract Images complete reliably on the user's 3-page test PDF instead of hanging at 2/3.

Changes:
- Reproduce against C:\Users\Admin\Downloads\BSIT-MI_Cecilio-Michael-organized.pdf.
- Identify the blocking PDF.js image/object operation.
- Add bounded waits/error isolation around per-image extraction so one problematic object cannot block a page forever.
- Advance page progress in a finally path and return supported images already found.
- Keep current local-only extraction and existing UI.

Verification:
- Re-run extraction logic against the supplied PDF.
- Targeted Biome, TypeScript, git diff --check, production build.

Scope: Extract Images reliability only. Delete/Rotate consolidation is a separate product cleanup and will not be removed in this bugfix unless explicitly requested.
