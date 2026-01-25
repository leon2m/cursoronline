## 2024-05-22 - Accessibility in Themed Components
**Learning:** Custom "hacker" or "themed" UIs often neglect basic HTML semantics (labels, ARIA roles) in favor of visual aesthetics, making them inaccessible.
**Action:** When creating stylized forms, always ensure visual labels are programmatically linked to inputs using `htmlFor` and `id`, even if the label text is stylized as code.