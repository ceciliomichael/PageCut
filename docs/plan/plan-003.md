# Plan 003: Refine drag-and-drop ordering

## Goal
Improve ordering interactions in Image to PDF, Merge PDFs, and Organize PDF so dragging is visually clear and precise.

## Changes
- Show a floating drag preview that follows the pointer and can move outside the left panel.
- Show a clear insertion indicator for the exact drop position.
- Reorder only when the user drops the item.
- Add a minimal hover treatment to draggable rows/cards without redesigning them.
- Replace the generic image icon in Image to PDF with a thumbnail of the actual image.
- Keep existing nested controls, click-to-preview behavior, and add-more-images behavior working.
- Reuse one shared drag-reorder implementation across all three ordering screens.

## Verification
- Run Biome checks on changed files.
- Run the production build to catch TypeScript and integration issues.

## Scope
Only ordering UX for Image to PDF, Merge PDFs, and Organize PDF, plus the Image to PDF thumbnail change.