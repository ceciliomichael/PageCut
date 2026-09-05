---
status: draft
---

# Live previews for every editor

Goal: make live preview a standard part of every configure/edit step: Split & Extract, Merge PDFs, Image to PDF, Organize PDF, Page Numbers, and Watermark. The last three already have previews.

Architecture: generalize the existing PDF.js canvas preview so it can render page specs from one or multiple source Files without rebuilding PDFs during edits. Split shows the source PDF and marks pages included by valid ranges. Merge shows the actual merged output order and valid selected page ranges across multiple PDFs. Image to PDF shows the actual output page order using the uploaded image files directly, without first generating a PDF. Existing Organize/Page Numbers/Watermark behavior remains intact.

UI: migrate Split, Merge, and Image-to-PDF configure screens to the same wide editor workspace with settings left and preview right. Preserve existing validation, reorder controls, naming, page-size/orientation options, and result generation.

Dependencies: no new dependency, reuse pdfjs-dist already installed and native image rendering.

Verification: targeted Biome on touched files, production build/TypeScript, git diff --check, inspect diffs/status. Preserve unrelated local changes and do not alter output-processing semantics.
