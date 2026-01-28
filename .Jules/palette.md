# Palette's Journal

## 2024-05-22 - Accessibility in Icon-Only Buttons
**Learning:** Icon-only buttons (like delete, new file) are invisible to screen readers without `aria-label`. They are also often inaccessible to keyboard users if they rely on `hover` states for visibility.
**Action:** Always ensure icon-only buttons have `aria-label`, `title`, and are visible on focus (`focus:opacity-100`).
