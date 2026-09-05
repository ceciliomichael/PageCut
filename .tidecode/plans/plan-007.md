---
status: draft
---

# Restore viewport centering

Goal: restore true viewport centering for normal PageShell screens after the unified header change.

Finding: the header currently participates in the flex column, so non-fullHeight content with justify-center is centered only in the remaining space below the header.

Implementation: for non-fullHeight PageShell screens, position the shared header independently from content and let the content container span the viewport for true visual centering, while keeping enough top/bottom padding to prevent overlap on shorter screens. Keep fullHeight editor flows unchanged in normal header/workspace flow.

Verification: targeted Biome on PageShell, production build, git diff --check. Scope is only shared shell centering, no redesign.
