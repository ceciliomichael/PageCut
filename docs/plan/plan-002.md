# Drag-to-reorder across PageCut

## Goal
Replace up/down ordering buttons with drag-to-reorder on every current PageCut configure screen that supports ordering.

## Scope
- Image to PDF image order.
- Merge PDFs source-file order.
- Organize PDF page order.
- Preserve existing controls, styling, previews, Image to PDF click-to-scroll behavior, and Add more images.

## Implementation
- Add one shared pointer-based reorder hook for items with stable IDs.
- Replace arrow controls with a compact drag handle in the same area of each row/card.
- Reorder immediately while dragging so live previews update with the list.
- Keep nested buttons and inputs independently usable.
- Add no new dependency.

## Verification
- Run Biome on all changed files.
- Run the production build to catch TypeScript and integration regressions.
