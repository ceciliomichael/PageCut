# Image to PDF preview/list sync

## Goal
Make the Image to PDF page-order list and main preview navigate each other.

## Changes
- Make each image row in the left page-order list clickable.
- Clicking a left row scrolls the matching preview page into view.
- Clicking a preview page scrolls the matching left row into view.
- Do not add selection or focus-ring styling to the existing rows or preview.
- Allow adding more JPG, PNG, or WebP images directly from the left column.
- Preserve existing move-up/move-down behavior and limit changes to Image to PDF.
- Add no new dependencies.

## Verification
- Run the relevant formatter/linter/type or build checks available in the project.
- Check that row clicks and preview clicks target the correct image after reordering.
