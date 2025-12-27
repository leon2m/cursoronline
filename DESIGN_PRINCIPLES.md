
# Cursor Premium - Design Principles & UI System

This document serves as the source of truth for all UI/UX decisions. The application enforces a **Strict Dark Mode** with Glassmorphism elements. Light mode is strictly prohibited to maintain the "Premium/Cyberpunk" aesthetic.

## 1. Core Color Palette

*   **Backgrounds:**
    *   `Global`: `#050505` (Deepest Black)
    *   `Surface (L1)`: `#0a0a0b` (Sidebar, Panels)
    *   `Surface (L2)`: `#121212` (Headers, Cards)
    *   `Glass`: `rgba(0, 0, 0, 0.4)` with `backdrop-filter: blur(20px)`

*   **Brand Colors:**
    *   `Primary`: `#2EA446` (Neon Green) - Used for primary actions, active states, and success indicators.
    *   `Secondary`: `#AFD244` (Lime) - Used for gradients and accents.
    *   `Destructive`: `#EF4444` (Red) - Delete, Error, Stop.

*   **Typography Colors:**
    *   `Headings`: `#FFFFFF` (100% White)
    *   `Body`: `#A1A1AA` (Zinc-400)
    *   `Muted`: `#52525B` (Zinc-600)

## 2. Component Styling Rules

### Buttons
*   **Primary:** `bg-brand-primary text-white rounded-full font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all`
*   **Ghost/Icon:** `p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all`
*   **Bordered:** `border border-white/10 bg-white/5 hover:border-brand-primary/50 text-white`

### Inputs & Forms
*   **Background:** `bg-black/20` or `bg-[#0f0f0f]`
*   **Border:** `border border-white/10` (Focus: `border-brand-primary/50`)
*   **Text:** `text-sm text-white placeholder:text-white/20`
*   **Radius:** `rounded-xl` or `rounded-2xl`

### Modals & Panels
*   **Background:** `bg-[#0c0c0c]` or `bg-black/90` with blur.
*   **Borders:** `border border-white/5`
*   **Shadows:** `shadow-2xl shadow-black/50`

### Sidebar & Navigation
*   **Active Item:** `bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary` (or solid brand color for icons).
*   **Inactive Item:** `text-gray-500 hover:text-white hover:bg-white/5`

## 3. Typography
*   **Font Family:** 'Inter' (UI), 'JetBrains Mono' (Code).
*   **Sizing:** Keep UI text small (`text-xs` or `text-[10px]`) but uppercase and bold (`font-black tracking-widest`) for labels.

## 4. Animation (Smooth Transition)
*   **Global:** `transition-all duration-300 ease-in-out`
*   **Hover:** subtle scaling or opacity changes. Do not use jarring color shifts.
