## 2024-05-22 - File Tree Keyboard Accessibility Issue
**Learning:** The File Tree component (`Sidebar.tsx`) uses nested `div` elements with `onClick` handlers for folder expansion and file selection. This completely blocks keyboard users from navigating the file structure.
**Action:** In future improvements, these should be refactored to use `<button>` elements or proper `role="treeitem"` with `tabIndex` and `onKeyDown` handlers to support Enter/Space activation and arrow key navigation.
