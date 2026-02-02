# Palette's Journal

## 2024-05-22 - Sidebar Accessibility
**Learning:** The file explorer tree was built using `div`s with `onClick` handlers, making it completely inaccessible to keyboard users. Nested interactive elements (delete button inside clickable row) caused accessibility conflicts.
**Action:** Refactored tree items to use semantic `<button>` elements. For items with secondary actions (delete), used a flex container with sibling buttons instead of nesting. This ensures robust keyboard navigation and screen reader support.
