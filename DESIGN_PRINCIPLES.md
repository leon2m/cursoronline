
# Cursor Premium - Design Principles & UI System

This document serves as the source of truth for the application's UI/UX. The design strictly mimics the **Cursor / VS Code** environment: professional, minimalist, and developer-focused.

## 1. Core Color Palette

*   **Backgrounds:**
    *   `Global`: `#09090b` (Cursor Dark)
    *   `Sidebar/ActivityBar`: `#000000` or `#18181b`
    *   `Editor`: `#1e1e1e` (VS Code Default Dark)
    *   `Panel`: `#09090b`
    *   `Input`: `#27272a`

*   **Brand/Accents:**
    *   `Primary`: `#3794FF` (Cursor Blue) - Used for focus states, primary buttons, and selection.
    *   `Secondary`: `#A855F7` (AI Purple) - Used specifically for AI related features.
    *   `Success`: `#22c55e`
    *   `Error`: `#ef4444`
    *   `Warning`: `#eab308`

*   **Typography Colors:**
    *   `Headings`: `#E4E4E7` (Zinc-200)
    *   `Body`: `#A1A1AA` (Zinc-400)
    *   `Muted`: `#52525B` (Zinc-600)
    *   `Active Item`: `#FFFFFF`

## 2. Component Styling Rules

### Buttons
*   **Primary:** `bg-brand-primary text-white rounded-[4px] px-4 py-1.5 text-xs font-medium hover:bg-brand-primary/90`
*   **Icon:** `p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10`
*   **Secondary:** `bg-[#27272a] text-white rounded-[4px] px-3 py-1.5 text-xs hover:bg-[#3f3f46]`

### File Explorer
*   **Tree Structure:** Indentation is key. 
*   **Folders:** Chevron icon + Name.
*   **Files:** File Icon + Name.
*   **Active File:** `bg-[#3794FF]/20 text-white` (Subtle blue tint).
*   **Hover:** `hover:bg-[#2a2d2e]`

### AI Interface
*   **Chat Bubbles:** clean, flat backgrounds (`#27272a` for user, transparent for AI).
*   **Input:** "Composer" style. Floating or fixed at bottom, borderless feel with distinct active border.

### Extensions
*   **Card:** `flex row`, Icon on left, Title/Desc on right. "Install" button is small, blue, on the right.

## 3. Typography
*   **Font Family:** 'Inter' (UI), 'JetBrains Mono' (Code).
*   **Sizing:** 
    *   Sidebar: `text-[13px]`
    *   Tabs: `text-[12px]`
    *   Headers: `text-[11px] uppercase font-bold tracking-wider`
