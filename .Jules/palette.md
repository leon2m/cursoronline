## 2025-05-15 - Sidebar Accessibility Refactor
**Learning:** The Sidebar file tree used `div` elements with `onClick` handlers, making it inaccessible to keyboard users and screen readers. Additionally, critical actions like "Delete" were hidden behind hover states without focus visibility.
**Action:** When refactoring tree-like structures, convert interactive items to semantic `<button>` elements. For list items with secondary actions (like delete), split the item into a primary "Select" button and a secondary "Action" button. Ensure secondary actions are visible on `focus`.
