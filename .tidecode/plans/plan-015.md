---
status: draft
---

# Per-page PDF crop

Goal: make Crop PDF independent per page instead of sharing one crop across the document.

Changes:
- Change crop session options from one CropMargins object to per-page margins.
- Track/select the active page in the crop editor; numeric controls edit only that page.
- Crop overlay on each preview page reads/writes that page's own margins and selecting a page updates the setup panel.
- Add an explicit Apply to all pages action so shared cropping is opt-in.
- Final pdf-lib processing validates and applies the margins for each page separately.
- Preserve current 1% minimum visible area, mobile Setup/Preview tabs, and all other tools.

Verification: targeted Biome, production build, git diff --check, grep for old single-margin crop assumptions.
