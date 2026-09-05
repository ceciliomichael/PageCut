---
status: draft
---

# Center newer upload dropzones

Goal: make the newer upload dropzones center exactly like Merge PDFs.

Root cause: Merge uses a block div for its dropzone, while Image to PDF and the shared Organize/Page Numbers/Watermark upload component use native button elements. Their mx-auto does not center reliably while they remain inline-level/inline-block.

Implementation: restore PageShell to the shared flex layout used before the centering detour, then make the newer upload buttons explicitly block-level so max-w-2xl mx-auto centers them. No other layout redesign.

Verification: Biome on touched TSX, production build, git diff --check, and headless Chrome screenshots comparing Merge and Page Numbers at the same viewport.
