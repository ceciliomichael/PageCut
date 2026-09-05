---
status: draft
---

# Real-time PDF editing previews

Goal: add accurate, local, real-time previews to Organize PDF, Add Page Numbers, and Add Watermark before adding more tools.

Approach: reuse pdf-lib and the existing utility logic. Generate only one selected page as a preview PDF, cache the loaded source PDF by File, and render the preview with a browser PDF embed. This avoids a new dependency and avoids rewriting the entire document after every edit.

UI: add a reusable preview panel with loading/error states and page navigation. Organize will let users select a page to preview while reorder/rotate/remove controls update it. Page Numbers and Watermark will use a two-column settings + preview layout on desktop and stack on mobile.

Performance/reliability: revoke blob URLs, debounce rapid changes, reuse a cached source PDF, keep all work local, and use the exact same positioning/format calculations as final output.

Verification: targeted Biome check, production Next.js build, git diff --check, and review status so unrelated AGENTS.md/package-lock.json changes remain untouched.

Scope: no new PDF tools or unrelated cleanup in this change.
