# Drag interaction fix

## Goal
Make dragging feel direct and predictable across Image to PDF, Merge PDFs, and Organize PDF.

## Changes
- Start dragging from the whole reorderable card/row, not only the grip.
- Keep inner action controls usable by excluding only true controls such as rotate, delete, range buttons, and inputs from drag starts.
- Use a small movement threshold so normal clicks still work.
- Position the floating card using the exact pointer offset from the original card, so it stays directly under the cursor.
- Render the floating item with the same visual structure and dimensions as its source card.
- Preserve the existing insertion indicator and hover treatment.

## Verification
- Run targeted Biome formatting/checks for the drag helper and three configure screens.
- Run the production build for TypeScript and integration verification.

## Scope
No unrelated PageCut features or styling changes.