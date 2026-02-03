## 2024-05-22 - Interactive Lists
**Learning:** Interactive list items (files/folders) are implemented as `div`s with `onClick`, lacking keyboard access (`tabIndex`, `onKeyDown`, `role`).
**Action:** Always include `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers for Enter/Space when making custom interactive elements.

## 2024-05-22 - Entry Point
**Learning:** The `index.html` file was missing the entry point script tag (`<script type="module" src="/index.tsx"></script>`), causing a blank screen on load.
**Action:** Ensure `index.html` properly imports the main entry point.
