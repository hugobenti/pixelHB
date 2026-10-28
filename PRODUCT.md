# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Hobbyist pixel artists** drawing sprites, icons and small scenes for fun, in sessions that range from a few minutes to an evening.
- **Indie game developers** producing game assets (sprites, tiles, UI icons) they export as PNG into an engine.

Both use it on desktop and on phones; the phone experience must hold up, not just render.

## Product Purpose

A browser pixel-art editor that needs no account and no install: open it, draw, export, and keep the art in their own Google Drive if they choose. Success is an artist finishing a piece (or an asset) without the tool getting in the way, and coming back to their gallery later to continue.

## Positioning

Local first, yours always: artworks live in the browser's IndexedDB with no account needed; signing in with Google keeps them in the user's own Drive. PixelHB stores no artwork. Canvases go up to 1000 × 1000 pixels with an indexed palette of up to 256 colors, layers, a reference image overlay and center guides.

## Operating Context

- Surfaces: the **home** page (`/`), **Help** (`/help`, including keyboard shortcuts), **About** (`/about`), **Privacy** (`/privacy`), **Feedback & contact** (`/contact`), a **404** page and an **error** page, all inside a shared site header (with the optional Google account control) and footer; the **gallery** (`/gallery`: list, create, rename, clone, delete, import JSON); and the **editor** (`/editor/[id]`: canvas, palette, tools (brush, bucket, color picker, pan), layers drawer, settings drawer with canvas size, image detail and import/export). The editor has no site header or footer.
- The artwork is the focus; the interface frames it. Users stare at saturated, arbitrary palette colors for long stretches, so chrome must not compete with or tint the perception of those colors.
- Input: mouse/trackpad plus keyboard shortcuts on desktop; touch (pinch, drag) on phones. The canvas viewport owns wheel, pinch and drag; nothing else may hijack scrolling.

## Capabilities and Constraints

- Next.js App Router, Tailwind v4 with semantic tokens declared once in `src/app/globals.css`; no third-party UI kit; canvas renderers read colors from the same CSS variables.
- All UI copy lives in `src/content`.
- Layer data is `Uint8Array` indexed into a per-artwork palette; PNG and JSON import/export.
- Product name: PixelHB. The brand spec (logo, palette, usage) is in `docs/design/brand.md`.

## Evidence on Hand

No testimonials, user counts, press or showcase artwork exist. Do not fabricate them; sample artwork in mockups must be clearly illustrative.

## Product Principles

1. The artwork is the hero; chrome recedes and stays color-neutral enough not to distort palette perception.
2. Local first, yours always: no sign-up needed, no waiting, work survives a reload, and the art belongs to the artist.
3. Precise at every size: a pixel is a pixel, on a 27" monitor and on a phone.
4. Every tool is reachable by keyboard and by touch.

## Accessibility & Inclusion

WCAG 2.2 AA contrast for every token pair (enforced by `src/app/tokenContrast.test.ts`), visible focus, an accessible name on every control, keyboard access to every tool, and `prefers-reduced-motion` honored (opacity fades only).
