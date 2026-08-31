# Design System: Simple Brutalism for DeployGuard

## Visual Philosophy
DeployGuard implements a **Simple Brutalistic** design language focused on high-density information architecture, zero decorative noise, and instantaneous operational scanability under critical incident response scenarios.

## Core Foundation: Black & White

### Dark Mode (`.dark`)
- **Background**: `#0a0a0a` (`0 0% 4%`)
- **Foreground / Text**: `#fafafa` (`0 0% 98%`)
- **Cards / Containers**: `#121212` (`0 0% 7%`)
- **Borders**: `#2e2e2e` (`0 0% 18%`)
- **Primary Action**: Inverted `#fafafa` background with `#0a0a0a` text
- **Secondary / Muted**: `#242424` (`0 0% 14%`)

### Light Mode (`:root`)
- **Background**: `#ffffff` (`0 0% 100%`)
- **Foreground / Text**: `#121212` (`0 0% 7%`)
- **Cards / Containers**: `#ffffff` (`0 0% 100%`)
- **Borders**: `#d4d4d8` (`0 0% 85%`)
- **Primary Action**: Jet Black `#171717` background with `#fafafa` text
- **Secondary / Muted**: `#f4f4f5` (`0 0% 94%`)

## Semantic Highlight Accents
Color is never used as arbitrary decoration. It is strictly functional and reserved for operational states:
- **Nominal / Armored / Pass**: Signal Emerald (`#10b981` Dark / `#059669` Light)
- **Incident / Anomaly Spike / Error**: Signal Rose/Crimson (`#f43f5e` Dark / `#dc2626` Light)
- **Caution / Warning**: Signal Amber (`#f59e0b` Dark / `#d97706` Light)
- **Trace Focus / Observation**: Signal Cyan (`#06b6d4` Dark / `#0284c7` Light) / Indigo (`#6366f1`)

## Component Architecture (shadcn/ui)
All interactive elements and containers are built on **shadcn/ui** patterns using `@radix-ui` primitives, `class-variance-authority` (CVA), `clsx`, and `tailwind-merge`:
- `Button`: Sharp tactile buttons with `default`, `outline`, `secondary`, `destructive`, `brutalist`, and `brutalistPrimary` variants.
- `Badge`: High-contrast status chips with semantic variants (`success`, `destructive`, `warning`, `info`, `brutalist`).
- `Card`: Geometric structural boxes with clean 1px/2px borders.
- `Tabs`: Accessible tabs with high-contrast active states.
- `Dialog`: Accessible modal drawers with backdrop blur and brutalist frames.
- `Table`: Clean tabular displays for metric deltas and IAM permission matrices.
- `ScrollArea`: Custom scrollbars integrated with system palette.
- `Tooltip`: Minimalist tooltips for hover annotations.
- `ThemeToggle`: First-class Light/Dark mode switcher with `next-themes`.

## Typography & Rhythm
- **Sans**: System UI stack (`font-sans`) for structural headings, descriptions, and SRE prose.
- **Monospace**: `font-mono` for all metrics, numbers, timestamps, trace IDs, service account identifiers, and code blocks.
- **Borders & Radii**: Crisp geometric 2px radius (`rounded-sm`) or 0px (`rounded-none`).
