## 2024-05-23 - Accessibility in Icon-Heavy UIs
**Learning:** Icon-only buttons and search inputs frequently lack accessible names (aria-label) in this codebase, relying solely on `title` or placeholders which are insufficient for screen readers.
**Action:** Systematically audit all `Lucide` icon buttons and `input` fields for `aria-label` when touching any component.
