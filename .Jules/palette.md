## 2024-03-24 - AI Assistant Accessibility Gaps
**Learning:** The AI Assistant interface relied heavily on icon-only buttons (using `lucide-react`) and color-coded state indicators without corresponding ARIA attributes. This made the core feature of the app difficult for screen reader users to navigate.
**Action:** When using icon-only buttons or custom toggle switches, always ensure `aria-label` or `aria-pressed` attributes are present to communicate purpose and state non-visually.
