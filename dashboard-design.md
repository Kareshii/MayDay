
Build a complete multi-view Admin Dashboard System using **Vue 3 (Composition API, `<script setup lang="ts">`) + TypeScript + Tailwind CSS + Vue Router**.

The entire backend system must strictly adhere to the **"Aurora Weather / Central Jakarta" Liquid-Glass Design Language**—transforming the single-page reference into a scalable, pixel-faithful, multi-module administration system over a full-bleed atmospheric background.

═══════════════════════════════════════

1. TECH STACK & ARCHITECTURE
   ═══════════════════════════════════════

- **Framework**: Vue 3.4+ (`<script setup lang="ts">`), strict TypeScript interfaces for all props, states, and API models.
- **Styling**: Tailwind CSS (configured with custom CSS variables `--u`, custom utility classes for liquid-glass recipes, and arbitrary value support `calc(N*var(--u))`).
- **Routing**: Vue Router 4 with a persistent AppShell (`<GlassStageLayout>`) and animated route transitions (`<Transition name="glass-view" mode="out-in">`).
- **Icons**: A global `<SvgSprite />` component mounted at the root (`App.vue`) containing all inline SVG `<symbol>` definitions, paired with a reusable `<AppIcon name="i-..." />` component. No external icon libraries.
- **State**: Reactive state management (Pinia or composable stores) for active route indicator (sliding white pip), global search modal, notifications drawer, and regional weather/telemetry data.

═══════════════════════════════════════
2. GLOBAL DOCUMENT & SHELL CONFIG
═══════════════════════════════════════

- **Default Title**: Aurora OS — Liquid Glass Admin (`Weather Forecast — Central Jakarta` on Dashboard route)
- **Root Attributes**: `lang="en"`, `viewport: width=device-width, initial-scale=1, viewport-fit=cover`
- **Fallback Base Background**: `#04121b` | **Primary Ink**: `#ffffff`
- **Typography**: Antialiased Inter stack; `font-feature-settings: "kern" 1`
- **Viewport Lock**: `html, body, #app { height: 100%; overflow: hidden; }` on desktop (`>860px`), unlocking to smooth vertical scroll on mobile (`≤860px`).

═══════════════════════════════════════
3. FONTS (Tailwind & HTML Head Config)
═══════════════════════════════════════
Load in `index.html`:

```html
<link rel="preconnect" href="[https://fonts.googleapis.com](https://fonts.googleapis.com)">
<link rel="preconnect" href="[https://fonts.gstatic.com](https://fonts.gstatic.com)" crossorigin>
<link href="[https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500&display=swap)" rel="stylesheet">
```
