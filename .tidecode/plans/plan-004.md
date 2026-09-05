---
status: draft
---

# Full-document live PDF workspace

Goal: replace the page-at-a-time preview and form-heavy configure UI with a full-document live PDF workspace for Organize PDF, Add Page Numbers, and Add Watermark.

Implementation: generate the complete edited PDF in memory after a short debounce using shared pdf-lib transformation logic, show it in one continuous embedded PDF viewer, and revoke old object URLs. Organize preview reflects full reorder/remove/rotation state. Page Numbers and Watermark preview reflect all pages at once.

Design: convert configure screens to a desktop workspace with a compact left settings rail and large right document canvas, stack on mobile, reduce centered headings/card clutter, move primary action into the settings rail, and keep the global PageCut shell/step indicator.

Performance: cache parsed source PDFs by File and only regenerate after changes settle. No artificial limits or server uploads.

Verification: targeted Biome check, production build, git diff --check, and status review. Scope excludes new PDF tools and unrelated AGENTS.md/package-lock.json changes.
