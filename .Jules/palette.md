## 2024-05-22 - Icon-Only Button Accessibility
**Learning:** The application heavily relies on Lucide icons for buttons without text labels (ActivityBar, Sidebar actions). These consistently lacked `aria-label` attributes, making them inaccessible to screen readers despite having `title` attributes in some cases.
**Action:** When adding or modifying icon-only buttons, always ensure `aria-label` is present and descriptive. For list items (like extensions), include the item name in the label (e.g., "Install {ExtensionName}") to provide context.
