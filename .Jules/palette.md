## 2024-05-22 - Nested Interactive Controls in File Tree
**Learning:** Placing a secondary action button (like delete) inside a parent `div` with `role="button"` causes screen readers to announce the parent as containing the child's label (e.g., "App.tsx Delete App.tsx").
**Action:** In future designs, separate the primary tap target and secondary actions into sibling elements within a container, or ensure the secondary action is hidden from the parent's accessible name calculation if appropriate.
