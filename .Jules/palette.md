# Palette's Journal

## 2025-05-20 - Interactive Nesting Patterns
**Learning:** The "Delete button inside Selectable item" pattern (used in Sidebar and Tabs) makes semantic HTML conversion difficult. Converting the parent container to a `<button>` creates invalid "interactive inside interactive" HTML.
**Action:** Use `div` with `tabIndex="0"` and `onKeyDown` handlers for the parent container to ensure keyboard accessibility without breaking HTML semantics.
