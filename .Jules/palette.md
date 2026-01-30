# Palette's Journal

## 2026-01-30 - Accessible File Tabs
**Learning:** Interactive list items (like file tabs) implemented as `div`s are invisible to keyboard users. Adding `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers is a low-effort, high-impact fix.
**Action:** Always verify keyboard reachability for custom interactive elements using `tab` navigation or automated tests.
