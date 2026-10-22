---
sidebar_position: 10
title: Theming and visual tokens
description: Flixer's Tailwind v4 color tokens, dark/light overrides, page gutter utility, and conventions for consistent components.
---

# Theming and visual tokens

The design system is defined in `src/tailwind.css`. Tailwind CSS v4 is imported with `@import 'tailwindcss'` and its Vite plugin. Components use generated utilities such as `bg-flixer-background`, `text-flixer-muted`, and `border-flixer-border` rather than repeating the palette's hex values.

## Default dark palette

| Token | Value | Typical use |
| --- | --- | --- |
| `flixer-background` | `#080811` | Main page and deepest backgrounds. |
| `flixer-surface` | `#14131d` | Cards, menus, and panels. |
| `flixer-border` | `#292735` | Subtle outlines and dividers. |
| `flixer-primary` | `#7645d7` | Main brand actions. |
| `flixer-secondary` | `#5366e7` | Secondary brand / gradient color. |
| `flixer-accent` | `#a789ff` | Focus, emphasis, and interactive highlights. |
| `flixer-cyan` | `#4bd9e8` | Complementary status/gradient color. |
| `flixer-text` | `#f4f2fb` | Main foreground text. |
| `flixer-muted` | `#9492a4` | Secondary text. |
| `font-sans` | `'Segoe UI', system-ui, sans-serif` | Application sans-serif stack. |

These are declared as `--color-flixer-*` and `--font-sans` inside Tailwind's `@theme`, so Tailwind creates utilities such as `bg-flixer-surface`, `text-flixer-accent`, `border-flixer-border`, and `font-sans`.

## Light theme and dark islands

Dark mode is the root default. `useTheme()` persists `dark`, `light`, or `auto` in local storage (`flixer.theme`). `auto` follows `prefers-color-scheme: light`. `initTheme()` toggles `html.light`, updates the page's `color-scheme` and the `theme-color`/`color-scheme` meta elements, and installs the system-preference change listener.

`html.light` overrides the palette to a light background (`#f5f4fa`), white surface, darker text, and adjusted brand colors. It also maps Tailwind's `--color-white` to a dark ink color (`#14131d`) so existing white foreground/overlay utilities invert with the light palette. The `.theme-dark` scope resets the dark palette variables, `--color-white`, and `color-scheme` for deliberately dark areas inside a light page—currently used for experiences such as the video/lyrics overlays and subtitle text. Keep that wrapper when adding dark-only artwork/text treatment so global light overrides do not reduce contrast.

## Layout utility and base rules

The custom `@utility page-gutter` aligns content with the floating header's max width and responsive padding. Reuse it for page sections that should share the app's horizontal content edge. Other base rules in the stylesheet reserve bottom room when the mini-player is active (`html.has-mini-player`), preserve mobile scrolling while hiding touch-device scrollbars, prevent iOS input zoom by maintaining a minimum 16px input size, and style autofill with theme variables.

## Consistent component styling

- Start with the semantic Flixer token utilities; use `bg-flixer-background`, `bg-flixer-surface`, `border-flixer-border`, `text-flixer-text`, and `text-flixer-muted` for page/card/text hierarchy.
- Use primary for main actions and accent for focus/selection. Preserve visible `focus-visible` outlines and readable disabled states.
- Use white/translucent utilities for overlays only with care: in light mode `--color-white` is intentionally remapped. Use `.theme-dark` for regions that must keep true white and the dark palette.
- Preserve accessible labels and contrast when adding icons, disabled controls, or status colors; do not communicate state with color alone.
- Reuse existing layout patterns such as `page-gutter`, `AdminSection`, and the home media cards instead of introducing a near-duplicate spacing or surface style.

Tailwind v4 is configured through the CSS import and `@tailwindcss/vite` plugin; there is no separate `tailwind.config.js` in the project root.
