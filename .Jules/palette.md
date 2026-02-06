## 2024-05-22 - Sidebar Accessibility
**Learning:** Nested interactive elements (like a delete button inside a clickable file row) create accessibility traps. Using sibling buttons with `flex-1` for the main label enables full keyboard accessibility without breaking the visual layout.
**Action:** When refactoring complex list items, separate primary and secondary actions into sibling `<button>` elements and use `focus-visible` rings to indicate the active area clearly.
