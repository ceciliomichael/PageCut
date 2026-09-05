---
status: draft
---

# Reusable custom dropdown controls

Goal: remove visible focus rings/outlines from PageCut input fields and replace native select elements with a reusable designed dropdown.

Implementation: update shared .input-field focus styles so focus does not add outline, ring, shadow, or border-color shift. Add a client-side CustomSelect component using existing CSS variables and lucide icons, with controlled value/onChange, keyboard navigation (ArrowUp/ArrowDown/Home/End/Enter/Space/Escape), outside-click close, ARIA listbox semantics, disabled support, and no browser-native select UI. Replace the two Page Numbers native selects with CustomSelect.

Dependencies: none.

Verification: grep to ensure no native <select> remains in src, targeted Biome, production build, git diff --check. Preserve all unrelated local changes.
