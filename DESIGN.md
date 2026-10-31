---
name: PixelHB
description: A local-first browser pixel-art editor; warm paper by day, warm graphite by night, the artwork always leads.
colors:
  bg: "#ece9e1"
  surface: "#fcfbf7"
  surface-subtle: "#f6f4ee"
  surface-muted: "#efece5"
  surface-strong: "#e3dfd5"
  surface-inverse: "#1c1e26"
  scrim: "#17181d"
  line: "#dcd8cd"
  line-strong: "#c5c0b3"
  control-border: "#857f73"
  fg: "#1a1c24"
  fg-soft: "#262832"
  fg-secondary: "#3a3c46"
  muted: "#52535c"
  subtle: "#66666c"
  accent: "#b4500f"
  accent-hover: "#94410c"
  on-accent: "#fcfbf7"
  focus: "#b4500f"
  pick-primary: "#b4500f"
  pick-secondary: "#2b3a9e"
  brand-hb: "#b4500f"
  danger: "#b3261e"
  danger-hover: "#8e1d17"
  on-danger: "#fcfbf7"
  danger-surface: "#faeee9"
  danger-line: "#ecc3b8"
  danger-fg: "#8e1d17"
  danger-fg-strong: "#4a0f0b"
  success-surface: "#edf2e6"
  success-line: "#bfd2b0"
  success-fg: "#234a1c"
  checker-light: "#e8e6e0"
  checker-dark: "#d3d0c8"
  grid-line: "color-mix(in srgb, var(--color-fg) 24%, transparent)"
  guide-horizontal: "#c0261d"
  guide-vertical: "#2b3a9e"
  guide-halo: "transparent"
  loupe-edge-dark: "#000000"
  loupe-edge-light: "#ffffff"
  google-btn-fill: "#ffffff"
  google-btn-stroke: "#747775"
  google-btn-text: "#1f1f1f"
  google-btn-state: "#303030"
  bg-dark: "#141312"
  surface-dark: "#1c1b19"
  surface-subtle-dark: "#22211f"
  surface-muted-dark: "#292826"
  surface-strong-dark: "#353330"
  surface-inverse-dark: "#ece8e1"
  scrim-dark: "#000000"
  line-dark: "#2f2d2a"
  line-strong-dark: "#46433f"
  control-border-dark: "#78736b"
  fg-dark: "#efebe5"
  fg-soft-dark: "#ddd8d0"
  fg-secondary-dark: "#c3bdb4"
  muted-dark: "#a7a198"
  subtle-dark: "#948e85"
  accent-dark: "#eda743"
  accent-hover-dark: "#f5bb64"
  on-accent-dark: "#1b1307"
  focus-dark: "#f5bb64"
  pick-primary-dark: "#eda743"
  pick-secondary-dark: "#7cb2ff"
  brand-hb-dark: "#eda743"
  danger-dark: "#f0605f"
  danger-hover-dark: "#ff7d7a"
  on-danger-dark: "#1d0707"
  danger-surface-dark: "#2a1717"
  danger-line-dark: "#5e2c2a"
  danger-fg-dark: "#ff8e8a"
  danger-fg-strong-dark: "#ffcdc9"
  success-surface-dark: "#15231a"
  success-line-dark: "#2d4a36"
  success-fg-dark: "#8fdca7"
  checker-light-dark: "#757370"
  checker-dark-dark: "#6b6965"
  grid-line-dark: "color-mix(in srgb, var(--color-muted) 34%, transparent)"
  guide-horizontal-dark: "#ff5c5c"
  guide-vertical-dark: "#5fa8ff"
  guide-halo-dark: "#000000"
  loupe-edge-dark-dark: "#000000"
  loupe-edge-light-dark: "#ffffff"
  google-btn-fill-dark: "#131314"
  google-btn-stroke-dark: "#8e918f"
  google-btn-text-dark: "#e3e3e3"
  google-btn-state-dark: "#ffffff"
typography:
  page-title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  section-heading:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "16px"
  caption:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  numeric:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  xl: "12px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg-soft}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-muted}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-soft}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.surface-subtle}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  color-swatch:
    rounded: "{rounded.md}"
    size: "40px"
---

# Design System: PixelHB

## Overview

**Creative North Star: "The Sketchbook and the Darkroom"**

PixelHB is one studio seen under two lighting conditions. By day it is a sketchbook on a desk: warm off-white paper, ink-dark text and a single burnt-amber accent. By night it is a darkroom: warm graphite chrome that steps back so the work glows, with amber as the only warm signal. The furniture never moves between the two; only the light changes. Whatever the lighting, the artwork is always the brightest, most saturated thing on screen.

The chrome is quiet, low-chroma and compact enough to leave the canvas room on a phone. Users stare at arbitrary, saturated palette colors for long stretches, so every neutral is a warm gray close to true neutral, every surface is flat, and there is exactly one accent per theme. One type system serves both themes: Schibsted Grotesk for the interface, JetBrains Mono for numbers. Switching theme changes color only, never metrics, so there is no layout shift.

This system replaces the earlier blue-gray theme (a `#cfd9df` page that tinted the palette, zinc grays, Arial overriding Geist, a solid red Delete on every card). How the two themes were chosen is recorded in `docs/design/explorations.md`.

**Key Characteristics:**

- Two themes, one set of semantic token names; light is "Paper & Ink", dark is "Studio Dark".
- Default theme follows the OS; the user can override it, and the choice persists.
- Warm, low-chroma neutrals; never a tinted surface behind the artwork.
- One accent per theme: burnt amber `#b4500f` in light, studio amber `#eda743` in dark.
- Depth by a soft shadow in light, by surface steps in dark.
- Every token pair meets WCAG 2.2 AA in both themes, enforced by a test.

## Brand

The logo, brand palette and usage rules live in [`docs/design/brand.md`](docs/design/brand.md). This document covers the interface design system.

## Colors

Warm paper and ink by day, warm graphite and amber by night: neutrals that stay out of the artwork's way, and one accent that marks what you can act on.

### Primary

- **Burnt Amber** (`#b4500f`, light) / **Studio Amber** (`#eda743`, dark): `accent`. The fill of the primary button and the primary-slot swatch ring (`pick-primary`). In light, the focus ring is the same burnt amber; in dark, focus uses the brighter amber `#f5bb64` (`accent-hover`) so it reads on graphite.

### Secondary

- **Ultramarine** (`#2b3a9e`, light) / **Sky Blue** (`#7cb2ff`, dark): `pick-secondary`. Only the ring around the secondary-slot swatch. Never a button, link or text color.

### Neutral

- **Desk Paper** (`#ece9e1`) / **Graphite Night** (`#141312`): `bg`, the page.
- **Sheet** (`#fcfbf7`) / **Graphite** (`#1c1b19`): `surface`, cards, modal, drawers, inputs.
- **Ink** (`#1a1c24`) / **Chalk** (`#efebe5`): `fg`, primary text.
- **Hairline** (`#dcd8cd`) / (`#2f2d2a`): `line`, dividers and sheet borders.

### Status

- **Oxblood** (`#b3261e`) / **Coral** (`#f0605f`): `danger`, destructive actions. Status colors (danger, success) are reserved for state, never decoration.

### Token table

Every color token, as declared in `src/app/globals.css`. Light values are the `@theme static` block; dark values are the `[data-theme="dark"]` overrides.

| Token              | Light                                                  | Dark                                                      | Role                                                                    |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `bg`               | `#ece9e1`                                              | `#141312`                                                 | Page background                                                         |
| `surface`          | `#fcfbf7`                                              | `#1c1b19`                                                 | Cards, modal, drawers, inputs, outline buttons                          |
| `surface-subtle`   | `#f6f4ee`                                              | `#22211f`                                                 | Outline-button and layer-row hover, settings panel wells                |
| `surface-muted`    | `#efece5`                                              | `#292826`                                                 | Ghost-button hover, thumbnail well, pressed outline button              |
| `surface-strong`   | `#e3dfd5`                                              | `#353330`                                                 | Highest surface step; transparent-color swatch in the image detail list |
| `surface-inverse`  | `#1c1e26`                                              | `#ece8e1`                                                 | Inverse surface: the editor's shift-direction arrow pad                 |
| `scrim`            | `#17181d`                                              | `#000000`                                                 | Overlay behind modals (40%) and drawers (45%), never a surface          |
| `line`             | `#dcd8cd`                                              | `#2f2d2a`                                                 | Sheet borders, dividers                                                 |
| `line-strong`      | `#c5c0b3`                                              | `#46433f`                                                 | Drawer edge, layer-row controls, empty-state dashes                     |
| `control-border`   | `#857f73`                                              | `#78736b`                                                 | Input and outline-button borders, idle swatch ring (≥ 3:1, WCAG 1.4.11) |
| `fg`               | `#1a1c24`                                              | `#efebe5`                                                 | Primary text, headings                                                  |
| `fg-soft`          | `#262832`                                              | `#ddd8d0`                                                 | Button labels, header icons                                             |
| `fg-secondary`     | `#3a3c46`                                              | `#c3bdb4`                                                 | Form labels                                                             |
| `muted`            | `#52535c`                                              | `#a7a198`                                                 | Secondary copy, intro lines, empty states                               |
| `subtle`           | `#66666c`                                              | `#948e85`                                                 | Hints, placeholders, captions                                           |
| `accent`           | `#b4500f`                                              | `#eda743`                                                 | Primary button fill, "both slots" swatch ring, active layer row border  |
| `accent-hover`     | `#94410c`                                              | `#f5bb64`                                                 | Primary button hover (darker in light, brighter in dark)                |
| `on-accent`        | `#fcfbf7`                                              | `#1b1307`                                                 | Text on `accent`                                                        |
| `focus`            | `#b4500f`                                              | `#f5bb64`                                                 | Focus outlines and input focus ring                                     |
| `pick-primary`     | `#b4500f`                                              | `#eda743`                                                 | Primary-slot swatch ring                                                |
| `pick-secondary`   | `#2b3a9e`                                              | `#7cb2ff`                                                 | Secondary-slot swatch ring                                              |
| `brand-hb`         | `#b4500f`                                              | `#eda743`                                                 | "HB" in the logo wordmark                                               |
| `danger`           | `#b3261e`                                              | `#f0605f`                                                 | Destructive button fill                                                 |
| `danger-hover`     | `#8e1d17`                                              | `#ff7d7a`                                                 | Destructive button hover                                                |
| `on-danger`        | `#fcfbf7`                                              | `#1d0707`                                                 | Text on `danger`                                                        |
| `danger-surface`   | `#faeee9`                                              | `#2a1717`                                                 | Error line and error toast background                                   |
| `danger-line`      | `#ecc3b8`                                              | `#5e2c2a`                                                 | Error toast border                                                      |
| `danger-fg`        | `#8e1d17`                                              | `#ff8e8a`                                                 | Error text                                                              |
| `danger-fg-strong` | `#4a0f0b`                                              | `#ffcdc9`                                                 | Error toast text                                                        |
| `success-surface`  | `#edf2e6`                                              | `#15231a`                                                 | Success toast background                                                |
| `success-line`     | `#bfd2b0`                                              | `#2d4a36`                                                 | Success toast border                                                    |
| `success-fg`       | `#234a1c`                                              | `#8fdca7`                                                 | Success toast text                                                      |
| `checker-light`    | `#e8e6e0`                                              | `#757370`                                                 | Transparency checkerboard, light squares                                |
| `checker-dark`     | `#d3d0c8`                                              | `#6b6965`                                                 | Transparency checkerboard, dark squares                                 |
| `grid-line`        | `color-mix(in srgb, var(--color-fg) 24%, transparent)` | `color-mix(in srgb, var(--color-muted) 34%, transparent)` | Editor pixel grid (canvas renderer)                                     |
| `guide-horizontal` | `#c0261d`                                              | `#ff5c5c`                                                 | Horizontal symmetry guide (canvas renderer)                             |
| `guide-vertical`   | `#2b3a9e`                                              | `#5fa8ff`                                                 | Vertical symmetry guide (canvas renderer)                               |
| `guide-halo`       | `transparent`                                          | `#000000`                                                 | Halo 2px wider than each symmetry guide (canvas renderer); dark only |
| `loupe-edge-dark`  | `#000000`                                              | `#000000`                                                 | Color picker: the black line on each side of the loupe ring and around the picked pixel |
| `loupe-edge-light` | `#ffffff`                                              | `#ffffff`                                                 | Color picker: the white line paired with `loupe-edge-dark`, so the edges read on any artwork color |
| `google-btn-fill`  | `#ffffff`                                              | `#131314`                                                 | Sign in with Google button fill (Google brand color, see below)          |
| `google-btn-stroke` | `#747775`                                             | `#8e918f`                                                 | Sign in with Google button border (1px, inside)                          |
| `google-btn-text`  | `#1f1f1f`                                              | `#e3e3e3`                                                 | Sign in with Google button label                                         |
| `google-btn-state` | `#303030`                                              | `#ffffff`                                                 | Sign in with Google hover (8%) and pressed/focus (12%) overlay           |

The `google-btn-*` tokens (and the `shadow-google-btn` hover elevation) are Google's brand colors, required by the [Sign in with Google branding guidelines](https://developers.google.com/identity/branding-guidelines) for app verification. They are the one exception to the PixelHB palette: use them for the Sign in with Google button only, never elsewhere. The button is 40px tall with 12px side padding, a 20px Google "G" and 10px between the "G" and the text. The "G" is Google's official gradient logo from its sign-in asset bundle, one image per theme (`--google-btn-logo`, `public/brand/google-g-{light,dark}.png`; sources in `AccountControl.style.ts`).

### Theming

- **Default and override.** There are two themes and no "System" option. A first visit follows `prefers-color-scheme`; once the user picks Light or Dark, the choice is stored in `localStorage` under `pixelcraft-theme` as `"light"` or `"dark"` and the OS setting is ignored from then on. The preference logic lives in `src/features/shared/theme/`: `themePreference.ts` (pure parse/resolve helpers, the option list and the pre-paint script, unit-tested) and `useThemePreference.ts` (hooks `useSetTheme`, `useResolvedTheme`, `useThemeSync`).
- **Switch.** The resolved theme is written to `data-theme` on `<html>`. An inline script rendered in `<head>` by `src/app/layout.tsx` sets it before first paint, so there is no flash of the wrong theme. `useThemeSync` (called in `src/app/AppProviders.tsx`) keeps it in sync with a pick in this or another tab, and with the OS setting while nothing has been picked yet.
- **Tokens.** Light values live in the `@theme static` block of `src/app/globals.css`; dark values override the same `--color-*` custom properties under `[data-theme="dark"]`, which also sets `color-scheme: dark`. Tailwind utilities (`bg-surface`, `text-muted`, `outline-focus`) resolve to whichever value is active.
- **Canvas.** The editor's canvas renderers read the grid, guide, checker and canvas-edge colors from the CSS variables (`--color-grid-line`, `--color-guide-horizontal`, `--color-guide-vertical`, `--color-guide-halo`, `--color-checker-light`, `--color-checker-dark`, `--color-line-strong`) and re-read them when the resolved theme changes. The checkerboard is drawn inside the artwork rectangle only, aligned to art pixels, with a 1px `line-strong` edge just outside it. The dark checker tones are lightened so the darkest palette color (`#1A1C2C`) keeps 3:1 against both; in dark the symmetry guides are lines over a `guide-halo` (black, 2px wider than the guide) so they read on any art or checker, and the contrast rule checks each guide against the halo at 3:1; in light there is no halo (`transparent`) and the guides are checked against both checker tones. The grid line keeps its pre-checker value.
- **Contrast.** `src/app/tokenContrast.test.ts` checks the same pair list against both token sets: text pairs at 4.5:1, UI pairs (focus, accent, danger, swatch rings, `control-border` on `bg` / `surface` / `surface-subtle`, guides on the checkerboard, `surface` on `surface-inverse`, the Google button border on its fill and the page) at 3:1. It also fails if the dark block leaves any color token undefined, so a light value can never leak into dark.

### Named Rules

**The Artwork Leads Rule.** The artwork is the brightest, most saturated thing on screen. Chrome stays low-chroma; surfaces are warm neutrals and are never tinted with a hue. No colored page backgrounds, gradients, glows or textures behind or around the canvas.

**The One Accent Rule.** Burnt amber in light, studio amber in dark. The accent marks the primary action and the primary-slot swatch ring; the only other use is the border of the active layer row, which is a selection of the same kind. Never decoration, headings, links or body text, with one exception: the Home "How it works" step numerals (01–03) use `text-accent` as decoration; nothing else does. One primary button per view; everything else is ghost or outline.

**The Tokens Only Rule.** Both themes come from the same semantic token names. Components use the token utilities and never branch on theme: no `dark:` variants, no `if (theme === "dark")` in style files or renderers, no hex literals. A color that looks wrong in one theme is fixed in that theme's token value. The Google brand colors of the Sign in with Google button are tokens too (`google-btn-*`), kept at Google's values in both themes.

## Typography

**UI Font:** Schibsted Grotesk (with `ui-sans-serif, sans-serif`)
**Numbers Font:** JetBrains Mono (with `ui-monospace, monospace`)
**Sign in with Google button:** Google Sans Medium 14px / 20px, 0.25px tracking (`font-google-btn`, not preloaded), as Google's branding guidelines require; nothing else uses it.

**Character:** A sturdy, slightly editorial grotesk that stays crisp in a dense toolbar, paired with a monospace for anything the user measures. The same faces and metrics in both themes, so a theme switch never reflows a line.

### Hierarchy

- **Display** (Schibsted Grotesk 700, 36px, 48px from `md`; `siteType.display`: `text-4xl font-bold tracking-tight`, `md:text-5xl`): the home page headline only.
- **Lead** (Schibsted Grotesk 400, 18px; `siteType.lead`: `text-lg text-muted`): the line under a page title or the home headline.
- **Page title** (Schibsted Grotesk 600, 24px / 32px; `siteType.pageTitle`: `text-2xl font-semibold`): one `h1` per screen: the gallery, Help, About, Contact, 404 and error headings.
- **Section** (Schibsted Grotesk 600, 20px; `siteType.section`: `text-xl font-semibold`): `h2` headings on the content pages.
- **Panel heading** (Schibsted Grotesk 600, 16px / 24px; `text-base font-semibold`): drawer and modal headings. Modal headings truncate on one line rather than wrapping.
- **Body** (Schibsted Grotesk 400, 14px / 20px; `text-sm`): descriptions, intro lines, form text.
- **Label / button** (Schibsted Grotesk 500, 13px / 16px): button labels, field labels, toggles. Until a migration lands, labels and buttons use `text-sm` (14px / 20px), as they do today.
- **Caption** (Schibsted Grotesk 400, 12px / 16px; `text-xs`): hints, limits, metadata.
- **Numbers** (JetBrains Mono 500, 12px / 16px; `font-mono`): canvas size, zoom percentage, hex values, coordinates.

### Named Rules

**The Measured in Mono Rule.** Every number the user reads or types as a measurement (W × H, zoom %, hex, opacity) is set in JetBrains Mono. Words stay in the grotesk; artwork titles and layer names are user content and stay in the UI face.

## Layout

- **Page frame.** Every page except the editor sits in `SiteShell`: `max-w-6xl` (1152px), `px-4` in the header, main column and footer alike, `py-8` (`py-12` from `sm`) in the main column. The footer is pushed to the bottom of short pages (`min-h-dvh` column).
- **Gallery.** Inside the shell's main column, `gap-6` between header and grid. The header is a heading row (title and count left, Import right, wrapping when narrow) over the storage note. The card grid is one column on phones, two from `sm` (640px), three from `lg` (1024px), four from `xl` (1280px), with `gap-6`.
- **Cards.** No `overflow-hidden` (the `⋯` dropdown must extend past the card); a full-bleed square thumbnail, then a `p-3` body with `gap-1` between the title row and the meta line.
- **Reading pages** (Help, About, Contact, 404, error). The shell column with `gap-10` (`gap-8` on Contact) between sections; the page title and lead sit in a `gap-3` header. Prose is capped at `max-w-prose` so lines stay readable; the pages never go full-width.
- **Modals.** An edge-to-edge bottom sheet on phones (top corners rounded, bottom safe-area inset), a centered card from `sm`. Widths `max-w-sm` / `max-w-md` / `max-w-lg`, all with `p-5` and `gap-4`; every size caps at 85dvh and scrolls without chaining to the page.
- **Side drawers.** Slide in from the right edge: 90% width on phones, half the viewport from `sm`, capped at 720px; full height with the bottom safe-area inset respected.
- **Hit targets.** Buttons are at least 40px tall (`min-h-10`), icon buttons 40 × 40, both 44px on coarse pointers (`pointer-coarse:`); step buttons 36 × 36. Swatches are 40px (comfortable) or 36px (compact).
- **Spacing.** The system uses Tailwind's 4px spacing scale directly; there are no named spacing tokens.

## Elevation & Depth

Depth is quiet and differs by theme, while the classes stay the same (The Tokens Only Rule).

- **Light (Paper & Ink).** Sheets of paper on a desk: cards carry one soft shadow (`shadow-sm`) plus a `line` border; overlays sit higher (modal `shadow-lg` / `shadow-xl`, side drawer `shadow-2xl`) over a `scrim` at 40–45%.
- **Dark (Studio Dark).** Shadows are not relied on; they barely register on graphite. Depth comes from stepping up the surface ramp: `bg` → `surface` → `surface-muted` → `surface-strong`, each step a little lighter, plus `line` / `line-strong` borders.

### Shadow Vocabulary

Tailwind's default shadows, unchanged per theme:

- **Resting** (`shadow-sm`): cards, outline buttons, inputs, button groups.
- **Floating** (`shadow-lg`): toasts, the editor's shift-direction pad, the color picker's loupe (`drop-shadow-lg`, it is round) and its "Release to cancel" pill.
- **Dialog** (`shadow-xl`): modals.
- **Drawer** (`shadow-2xl`): side drawers.

### Named Rules

**The Lighter Is Higher Rule.** In dark, a raised element is a lighter surface, never a darker one and never a glow.

## Shapes

Gently rounded, never pill-shaped and never sharp. Radius scale: **sm 4px**, **md 6px**, **lg 10px**, **xl 12px** (`--radius-*` in `@theme`).

- **xl (12px):** sheets: cards, modals, the gallery empty state.
- **lg (10px):** controls and inner wells: buttons, inputs, button groups, thumbnail wells, error banners.
- **md (6px):** swatches, step buttons.
- **sm (4px):** small inline targets such as the card title link focus area and the color picker input.

Borders are 1px (`line` for sheets and dividers, `line-strong` for controls). The empty state uses a dashed `line-strong` border. Thumbnails clip to their well.

## Components

Restrained and tactile: flat fills, 1px borders, color changes on hover, no motion beyond fades and the drawer slide.

### Buttons

- **Shape:** `rounded-lg` (10px), at least 40px tall, `px-3 py-2`, label in `text-sm font-medium`.
- **Primary:** `accent` fill, `on-accent` text, `accent-hover` on hover. One per view (The One Accent Rule).
- **Ghost:** transparent, `fg-soft` text, `surface-muted` fill on hover. The default for secondary actions (Rename, Duplicate, Cancel).
- **Outline:** `surface` fill, `control-border` border, `fg-soft` text, `shadow-sm`; `surface-subtle` on hover, `surface-muted` when pressed (Import file).
- **Danger:** `danger` fill, `on-danger` text, `danger-hover` on hover.
- **Step size:** 36 × 36 (`rounded-md`, `text-lg`), with ghost steps dimming to 40% when disabled.
- **Icon button** (`IconButton`): ghost, 40 × 40 (44 × 44 on coarse pointers), `rounded-lg`, 20px icon in `fg-soft`; its label is the accessible name and the tooltip, plus the shortcut when there is one ("Undo (Ctrl+Z)"). Toggles (pan, bucket, eraser, color picker, panels) set `pressed`: `surface-strong` fill, `fg` icon and an inset 1px `control-border` ring, with `aria-pressed`. A pressed state never uses the accent (The One Accent Rule). The color picker also shows pressed while Alt is held.
- **Icons:** one family in `public/icons`: 24-grid, 1.5 stroke, `currentColor` outlines (tested), rendered through `PublicMaskIcon` at 20px in toolbars, drawer headers and menus. One meaning per glyph: Export downloads, Load image is a photo, Shift pixels is the four-way move arrow, Canvas size the outward corners, Color picker the pipette. No text glyphs (`←`, `↑`) as icons.
- **Focus:** 2px outline, offset 2px, on `:focus-visible` only (`focus.style.ts`). Every variant uses the `focus` color; the outline never falls back to the browser's default ring.
- **Disabled:** 50% opacity, no pointer events.

### Cards

- **Corner Style:** `rounded-xl` (12px).
- **Background:** `surface` with a `line` border.
- **Shadow Strategy:** `shadow-sm` (see Elevation & Depth).
- **Artwork card:** a square thumbnail link on a `surface-muted` full-bleed well (`rounded-t-xl`, clipped by its own `overflow-hidden`; inside it a frame sized to the artwork's aspect ratio, centered and contained, wears the `pixel-checkerboard` so the checker never shows outside the art; the image fills the frame, `object-contain` with `image-rendering: pixelated`), a body with a title row (title link in `font-medium fg`, truncated, and the `Menu` overflow trigger `⋯` for Rename, Duplicate and Delete at its right) and a meta line under it (`text-xs muted`: size in `font-mono`, then "Edited …"). The card itself is not clipped, so the dropdown can overlap the cards below; the body is `p-3`. Delete opens `ConfirmDialog`; danger styling appears only on the confirmation button.
- **Thumbnails:** a lossless PNG of the visible layers at the largest integer scale that fits 256px, with no grid lines. Thumbnails saved by the old renderer (WebP or a fractional scale, which showed seams between pixels) are detected on gallery load (`isThumbnailCurrent`) and regenerated from the pixel data.

### Modal

- `src/features/shared/components/Modal.tsx`: one skeleton for every dialog. Header: the title as a panel heading (`text-base font-semibold fg`, wired to `aria-labelledby`) and a ghost X icon button; then the content; then an optional footer of right-aligned actions (Cancel ghost, primary last). Form dialogs pass `onSubmit`, so Enter in a field submits.
- Panel: `surface`, `line` border, `rounded-xl` (`rounded-t-xl` as a phone sheet), sized sm / md / lg (see Layout), `shadow-xl`.
- Overlay: `scrim` at 40% with a small backdrop blur by default (`dim="scrim"` drops the blur, `dim="none"` the scrim); clicking the backdrop dismisses, Escape covers the keyboard.
- Motion: overlay and panel fade in and out (the panel also rises 8px); opacity only under `prefers-reduced-motion`.

### Side Drawer

- Panel: `surface`, `line-strong` left border, `shadow-2xl`; slides in from the right (`translate-x`), or fades when `prefers-reduced-motion` is set.
- Backdrop: `scrim` at 45%, fading in and out.
- Header: `line` bottom border, heading `text-base font-semibold fg`, header icons 20px in `fg-soft`.

### Inputs / Fields

- **Style:** `surface` fill, `control-border` border, `rounded-lg`, `px-3 py-2 text-sm fg`, `shadow-sm`; placeholder in `subtle`.
- **Focus:** border turns `focus` with a 2px `focus` ring; no outline.
- **Field label:** `text-sm fg-secondary` stacked over the control with `gap-1`; hint in `text-xs subtle`.
- **Field error:** `text-xs danger-fg` under the control, linked with `aria-describedby`; the control gets a `danger` border via `aria-invalid`. Forms show errors inline and focus the first invalid field; toasts are for outcomes, not validation.
- **NumberField:** a whole-number text field (`inputMode="numeric"`, no spinner) in `font-mono tabular-nums`; it checks its range on blur and the form checks again on submit.
- **Size presets** (new artwork): a button group of mono chips (16 / 32 / 64 / 128) that fill width and height; the matching chip is pressed: `surface-strong` with an inset `control-border` ring (the IconButton pressed state), never the accent.
- **ColorField:** a 40px swatch (`rounded-md`, 1px `control-border` ring, no browser frame inside it) that opens the native picker, next to a mono upper-case hex input; picker and hex stay in sync, a pasted `#RRGGBB` applies at once, invalid hex shows inline. Used for the new-artwork background and in the palette editor.
- **Button group:** a `surface` shell with a `line-strong` border, `rounded-lg`, `p-0.5`, `shadow-sm`, holding adjacent buttons.

### Color Swatch

- 40 × 40 (comfortable) or 36 × 36 (compact), `rounded-md`, the swatch color itself as fill.
- **Rings:** idle 1px `control-border`; primary slot 2px `pick-primary`; secondary slot 2px `pick-secondary`; both slots 2px `accent`; selected (single-slot pickers) 2px `pick-primary` offset over `surface`. Rings offset by 2px over `bg` (the row's background) so the swatch color is never touched; a ring therefore reaches 4px past its swatch, so the palette row spaces swatches 10px apart (`gap-2.5`) and adjacent primary and secondary rings never touch; the scroller pads 4px so the first ring is not clipped.
- **Starter palette:** new artworks start with Sweetie 16 (by GrafxKid), ordered darkest (`#1A1C2C`, primary slot), lightest (`#F4F4F4`, secondary slot and default background), then the palette's warm-to-cool ramp. Growing the canvas fills new cells with the lightest palette color.
- **Removing a color:** an unused color is removed at once (with an Undo toast). If pixels use it, a ConfirmDialog names the color, says how many pixels use it, and asks what they become: transparent (a checkerboard chip) or any remaining palette color, with the closest one preselected. Pixels never silently switch to another color; Undo restores the color and its pixels.
- **Roving keyboard position:** a 2px dashed `focus` outline, offset 2px, distinct from the selection ring. While a color pick is held over a color, this marker moves to that color's swatch and the row scrolls it into view; it goes back if the pick is cancelled.

### Color Picker Loupe

- Shown only while a pick is held (`ColorPickerOverlay`, a fixed full-window layer that never takes pointer events and is `aria-hidden`).
- A 114px circle: a 12px ring split horizontally (top half: the color under the pointer; bottom half: the current color of the slot the pick fills), around a lens of 5 × 5 magnified pixels (18px cells) with the target cell outlined. Empty cells and an empty top half show the transparency checkerboard. No color name or hex.
- Edges: a 1.5px `loupe-edge-dark` line then a 1.5px `loupe-edge-light` line on both sides of the ring (outside: ring, black, white, artwork; inside: lens, black, white, ring), so the ring reads against the artwork and the lens in both themes. The pixel under the pointer gets a 2px white then 2px black outline on the canvas.
- Placement: above and to the right of the pointer (16px gap, 48px on touch so a finger never covers it), flipping sides near the window edges and kept inside the window when neither side fits. It may draw over the toolbar and palette row.
- Off the canvas the loupe hides and a `surface` pill with a `line-strong` border reads "Release to cancel"; it floats like the loupe, so a finger never covers it.

### Theme Toggle

- `src/features/shared/components/ThemeToggle.tsx`: a segmented native radio group, **Light / Dark**; the theme on screen is checked (the OS theme on a first visit). It is the "Theme" row in the editor settings drawer and in the phone menu sheet (`variant="row"`).
- In the site header the theme is an icon button instead (moon in light, sun in dark; its label names the theme it switches to), shown from `sm`. It stays invisible, with its layout kept, until hydration, because the server cannot know the stored theme and a wrong icon would flash.

### Switch

- `src/features/shared/components/Switch.tsx`: a full-width `role="switch"` row: optional icon, label and hint (`text-xs subtle`) on the left, a 40 × 24 `rounded-md` track on the right (`surface-strong` with a `control-border` edge; `fg` when on) holding a 18px `rounded-sm` `surface` thumb that slides 16px (`transition-transform`, none under reduced motion). Rows are 40px, 44px on coarse pointers, `surface-subtle` on hover. Disabled dims only the track, so the hint explaining why stays at full contrast. Used for Pixel grid and Reference image in the settings drawer.

### Confirm Dialog

- `src/features/shared/components/ConfirmDialog.tsx` on the small Modal, opened with `await confirm(…)` from `useConfirm()`: a `text-base` heading that names the target (Delete “Slime”?), a `text-sm muted` description, an optional warning note for the irreversible part (`danger-surface` fill, `danger-line` border, `danger-fg` text), then ghost Cancel (focused first) and the `danger` confirm button. Escape and the backdrop cancel. Used for deleting an artwork and cropping the canvas.

### Feedback

- **Error line** (gallery): `danger-surface` fill, `danger-fg` text, `rounded-lg`, `px-4 py-3 text-sm`, `role="alert"`.
- **Toasts:** a stack at the bottom on phones and top-centered from `sm`, each toast `rounded-lg`, 1px border, `py-2 pr-2 pl-4`, `shadow-lg`, message in `text-sm font-medium`, an optional text action (Undo) and an `x-mark` icon dismiss, both 32px targets. Tones: neutral (`surface`, `line`, `fg`), success (`success-surface`, `success-line`, `success-fg`), error (`danger-surface`, `danger-line`, `danger-fg-strong`). Errors are announced as alerts, the rest politely; errors and toasts with an action stay 8 s, others 4.5 s, and every timer pauses while the stack is hovered or focused.
- **Empty state** (gallery): dashed `line-strong` border, `rounded-xl`, `p-12`, centered: a 32px `muted` icon, a `text-base font-semibold` title, a `text-sm muted` line, then "New artwork" (primary) and "Import file" (outline) side by side. Only the Import button in the gallery header row carries the longer accessible name "Import file (.json)".
- **Skeleton** (gallery): until the first load settles, four card-shaped placeholders (`GallerySkeleton`: square well, title bar, meta bar) pulse on the same grid as the cards; the pulse stops under `prefers-reduced-motion`. A `role="status"` line carries the loading text for screen readers, and the artwork count stays hidden until the load settles.
- **Analytics consent banner** (`src/features/shared/analytics/AnalyticsConsentBanner.tsx`, every page, only when a PostHog key is configured and the visitor has not chosen): a non-modal `<section>` landmark fixed to the bottom, full width, `surface` with a `line` top border and `shadow-lg`; inside, at `max-w-6xl`, the `text-sm fg-secondary` text with a "Privacy details" link, then **Decline** and **Accept** as two outline buttons of equal weight (no accent: neither choice is pushed). Stacked on phones, one row from `sm`. It never covers anything: while shown it publishes its height as `--consent-banner-height`, which the body pads by and the editor shell subtracts from its height. It takes no focus and blocks no scrolling. The choice can be changed later with the "Usage analytics" Switch on `/privacy`.

### Layers Drawer Rows

- Borderless drag handle (grip, `muted`), then the preview (the only bordered box), the name, and ghost `IconButton` actions (visibility, duplicate, rename, delete). Delete opens `ConfirmDialog` naming the layer and is disabled while it is the only layer; when the active layer is deleted, the row that takes its place becomes active.
- Idle row: `surface` with a `line` border, `surface-subtle` on hover. Active row: `surface-muted` with an `accent` border, the one place the accent marks a selection outside the swatch rings.

### Site header and footer

- `src/features/shared/site/`: `SiteShell` wraps every page except the editor (skip link first, then header, `<main id="main">`, footer). Each page passes its own **primary action**; the default is a "Start drawing" link to `/gallery`, the gallery passes a "New artwork" button. On phones the labels shorten to "Draw" and "New" so the header never wraps.
- **Header.** A bottom `line` border on `bg`, one row at `max-w-6xl`: the logo (a link to `/`), the links Gallery, Help and About from `sm` (the current page has `aria-current="page"` and a `line-strong` underline; others are `fg-soft`), a flexible spacer, the theme icon button (from `sm`), then the primary action, the only accent on the page apart from the Home step numerals (The One Accent Rule).
- **Phone menu.** Under `sm` a menu icon button opens a bottom-sheet `Modal` (size sm) holding the links, Contact included, as 48px rows (the current one on `surface-muted`), then the theme row. Choosing a link closes the sheet, and so does navigating any other way (Back, Forward), so a sheet never reopens by itself.
- **Footer.** A top `line` border on `bg`, `text-sm muted`: the pencil mark with the tagline, the links (Gallery, Help, About, Contact, GitHub; 44px targets on coarse pointers), then the credit and copyright on one wrapping line.
- **Overflow menus.** `Menu` renders as a bottom sheet when the viewport is under `sm` or the pointer is coarse (`(max-width: 639px), (pointer: coarse)`), as 48px rows. Otherwise it is a dropdown that opens below its trigger and flips above it when it would not fit; it is measured before it is painted, so it never jumps.

### Site pages

- **Home** (`/`). A hero, then three promise cards, a "What’s inside" grid of eight feature cards (icon, title, one line; 2 columns below `lg`, 4 from `lg`), three numbered steps (44px `01`–`03` badges joined by a dashed `line-strong` connector: horizontal from `sm`, vertical on phones), a storage note and a closing panel (`.pixel-grid-panel`, centered pencil logo, heading, one line and the primary call to action). The hero is one column on phones, with the banner first; from `lg` it becomes two columns (text left, banner right). The banner is the brand pencil (`BrandLogo` banner variant) on the `.pixel-grid-panel` utility in `globals.css`: a `line` grid with one cell per logo pixel, drawn at an integer scale: 5× (250px) under 360px, 6× (300px) up to `lg`, 8× (400px) from `lg`, with the grid cell size following the scale so cells and pixels line up. The panel has a `line` border on `surface`, `rounded-lg`, no shadow or gradient. The grid sits behind the logo, never behind a user's artwork.
- **Help** (`/help`). Reading layout with a table of contents of in-page links and `scroll-mt-24` sections; the keyboard shortcuts are a table with key chips (`font-mono text-xs`, `control-border` outline), showing ⌘ / ⇧ on Apple platforms and Ctrl / Shift elsewhere. The gallery's storage note links to its `#saving` section.
- **About** (`/about`). Reading layout: title, lead, sections and a signature line.
- **Contact** (`/contact`, "Feedback & contact"). Reading layout with two option cards (`sm:grid-cols-2`), each a `Card` with an icon, section-style title, text and an outline action; the address is set in mono.
- **404 and error.** One `StatusScreen`: page title, lead, then the primary "Go to your gallery" link (always), an outline "Try again" button (error page only) and a plain link home. They use the same shell as every other page.

### Reading-page rules

- One `h1` per page, in the page-title style (the home page uses Display); sections use `h2` in the section style. Every route that exports `metadata` sets its own tab title: `<page> · PixelHB`, except Home, which reads "PixelHB · …"; the client error page cannot export metadata.
- Body text is `text-base fg-secondary`; links are `fg` with an underline offset of 4px (`siteType.link`), never the accent. Cards and bands are `surface` or bordered with `line`, not shadowed.
- Copy lives in `src/content` and states what the product does and where the data lives; no testimonials, counts or showcase claims (see PRODUCT.md, Evidence on Hand).

### Planned

Agreed follow-ups, not yet in the code:

- **Mono numeric readouts.** The settings size hint, zoom percentage and image-detail values move to JetBrains Mono (The Measured in Mono Rule); size fields and hex inputs already use it.
- **Type migration.** Labels and buttons move from `text-sm` (14/20) to the 13/16 label style; off-scale headings (`text-lg`) move onto the scale.

## Do's and Don'ts

### Do:

- **Do** style only through semantic token utilities (`bg-surface`, `text-muted`, `ring-pick-primary`); one class works in both themes.
- **Do** keep one `accent` element per view: the primary button (plus the Home step numerals).
- **Do** use ghost or outline buttons for everything that is not the primary action.
- **Do** set numbers the user measures in JetBrains Mono.
- **Do** express depth in dark with the surface ramp (`bg` → `surface` → `surface-muted` → `surface-strong`).
- **Do** check every new token pair against both themes in `src/app/tokenContrast.test.ts`.
- **Do** keep focus visible on `:focus-visible` with the 2px offset outline.

### Don't:

- **Don't** tint a surface or the page with a hue (the blue-gray `#cfd9df` page this system replaces did).
- **Don't** add a second accent, colored glows, neon or gradients.
- **Don't** use pure black (`#000`) as a surface; it is only the dark `scrim`, under transparency.
- **Don't** branch on theme in components or renderers (`dark:` variants, theme conditionals, hex literals).
- **Don't** put texture, pattern or color behind the artwork; the checkerboard is the only thing under the canvas.
- **Don't** use `pick-secondary` as a button or text color, or use the accent as body text (exception: the Home "How it works" step numerals (01–03) use `text-accent` as decoration; nothing else does).
- **Don't** change font size, weight or spacing between themes.
- **Don't** fill a destructive action red outside its confirmation dialog.
