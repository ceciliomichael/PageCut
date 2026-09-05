---
status: draft
---

# Mobile Setup and Preview tabs

Goal: on phones, replace the stacked setup + live preview editor with a two-tab Setup / Preview switch across all six tools. Desktop remains side-by-side.

Implementation: add mobile tab state in the shared PdfEditorWorkspace. Render a compact segmented tab control above the editor content, show only the setup pane or preview pane on screens below lg, keep both mounted on desktop. Keep preview components mounted when switching tabs so PDF.js/image render state is preserved. Adjust mobile preview height to fill the available editor area instead of using the previous stacked 62dvh treatment. Preserve all existing controls, actions, processing behavior, and desktop layout.

Accessibility: tab buttons expose aria-selected and tab semantics.

Dependencies: none.

Verification: Biome on shared components, production build/TypeScript, git diff --check, and inspect responsive class behavior. No unrelated changes.
