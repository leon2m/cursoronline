## 2026-02-04 - Accessible File Tree
**Learning:** Using `div` with `onClick` for file tree items excludes keyboard users. Refactoring to native `<button>` elements provides free keyboard support (Enter/Space) and focus management. For items with secondary actions (like delete), using sibling buttons prevents event bubbling issues and improves accessibility tree structure.
**Action:** Prefer semantic `<button>` elements for all interactive tree items and ensure secondary actions are siblings, not children.
