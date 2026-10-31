# Shareable exports: design

## Why

PixelHB has almost no users yet. Pixel art is shared constantly, so every image a user posts can bring the next user, provided that it looks good where it is posted and says where it was made. Today neither is true:

- **Export PNG** writes the artwork at 1×. A 32×32 sprite becomes a 32-pixel speck, and Instagram, Discord and X blur it when they upscale it.
- Sharing means downloading the file and attaching it by hand.
- Nothing in the image points back to PixelHB.

**Success:** people export at a size that reads well on social media, share straight from the editor, and the shared image carries a "made with PixelHB" credit. PostHog shows how often each of these happens.

## Goals

1. Export PNG at a chosen scale (×1, ×4, ×8, ×16, ×32), nearest-neighbour, so pixels stay sharp.
2. A "Made with PixelHB" credit strip added to exported and shared images, **on by default**, with a switch to turn it off (Hugo's decision).
3. One Share button, on every device (Hugo's decision):
   - **The system share sheet** wherever the browser can share image files: phones, and Chrome/Safari on macOS and Windows. It hands the image to Instagram, WhatsApp, X, Discord, TikTok, Mail and others.
   - **Otherwise,** copy the image so it can be pasted into any post.
   - **Otherwise,** download it.
4. Analytics that show which scale, credit setting and share method people use.

## Non-goals

- Animation, frames, GIF export. These need a new data model, a timeline UI and a file-format change: a separate project.
- Public share links or galleries. They need server storage, which PixelHB deliberately doesn't have.
- Per-network share buttons (X, Bluesky, Threads, Reddit, Discord). Considered, then dropped by Hugo: the share sheet covers them.
- Posting to social accounts through their APIs (OAuth per network, paid X API, server required).
- Watermarks drawn over the artwork.

## Anti-goals (a failure even if it works)

- The credit covers or alters the artwork. It sits **below** the art, never on it.
- The credit can't be removed. The switch is always one tap away, and turning it off is remembered.
- An export that crashes the tab or silently produces a blank image on a phone because the canvas is too big.
- Anything that sends the artwork to a server. Share and export stay on the device.

## Constraints

- Repo conventions in `AGENTS.md`:
  - presentation-only `.tsx`, behaviour in `useX.ts`, pure logic in `.ts` with tests
  - copy in `src/content`, types in `.type.ts`, token-only styling
  - the shared → editor boundary
  - ≤ ~20 files per PR, TDD for logic
- **Hugo: separate PRs, not one.** Each PR below ships on its own and leaves `main` working.
- **Canvas size limits:** iOS Safari refuses canvases above 16,777,216 pixels (4096 × 4096). Exports must stay within a **4096 px long edge**, and the credit strip counts towards that limit.
- Canvas renderers take colours from the existing palette or brand constants (`BRAND_FIXED_COLORS`, `BRAND_STATIC_THEME_COLORS` in `src/features/shared/brand/brandArt.ts`), never new hex literals.
- **Analytics:** event properties never carry names, pixels or palettes (see `IAnalyticsEvents`).
- **Domain:** the URL shown in the credit comes from `site.url` (`src/content/site.ts`), so it changes with the domain when one is bought.

## Decisions

### Hugo's

- Credit strip: **off by default for Download PNG**, **always on for Share** (Hugo's decision, 2026-10-31, replacing "on by default"). Download PNG is the primary action for game assets; the editor's Share now uses the same rule as the gallery's.
- Work split into separate PRs.
- Sharing: one Share button using the system share sheet, with no per-network buttons.

### My calls (correct me)

**Scale options.** ×1, ×4, ×8, ×16, ×32.
- An option is disabled when the output, including the credit strip, would exceed 4096 px on its long edge.
- **Download PNG default:** ×1 with no strip (2026-10-31 decision). The last choice is remembered per device and falls back to ×1 when it isn't allowed for the current artwork's size.
- **Share:** ignores the Download settings. It uses the smallest scale whose long edge reaches 1024 px (the largest allowed if none qualifies), with the strip on, via `shareExportOptions`. The editor and the gallery share one rule.

**Renderer.**
- `drawArtworkToCanvas` currently calls `fillRect` once per pixel per layer, which is slow for 1000×1000.
- New approach: compose the visible layers once into an `ImageData` at 1×, then draw it scaled with `imageSmoothingEnabled = false`.
- Output must be identical pixel for pixel to today at ×1: layers stack with `layers[0]` on top; palette colours are opaque `#rrggbb`, and an index beyond the palette is transparent.

**Credit strip.**
- A band under the artwork, as wide as the exported image. **Its height is derived from the export width only:** about 8% of the width, at least 32 px. Legibility wins over proportion. On wide, short art the band can be taller than the art; that is accepted.
- The strip's height counts towards the 4096 px cap. A scale whose art plus strip would exceed the cap is disabled.
- Contents: the PixelHB pixel wordmark (drawn from `WORDMARK_GRID`, so no font is needed) followed by the site host (`pixelhb.vercel.app`), drawn in the app's sans font. The strip uses the brand's light paper colour.
- **Narrow images:** when the export is narrower than 256 px, no strip is added and the switch explains why. A strip on a tiny image would be bigger than the art.
- The renderer reports whether it drew the strip. Analytics `credit` follows **what was drawn**, not the switch position.

**Credit switch.**
- One switch, "Add 'Made with PixelHB'", in the export panel. **Off by default** (2026-10-31 decision).
- The choice is stored on the device (`pixelhb.`-prefixed localStorage key, like the theme and consent choices).
- It applies to Download PNG only; Share always adds the strip.

**Share.**
- Shown on every device. It always uses the share rule above, not the Download PNG scale and credit choices.
- **Order of attempts:**
  1. If `navigator.canShare({ files: [png] })` is true, call `navigator.share({ files: [png] })` with files only, no `text`/`url`. Some iOS apps drop the image or turn the post into a link when they are attached; the strip already carries the URL.
     - `AbortError` (the user cancelled) → no toast, no event.
     - `NotAllowedError` or any other error → fall through to step 3.
  2. Otherwise, if the browser can write images to the clipboard (`ClipboardItem`), copy the PNG and show "Image copied. Paste it into your post." If the write fails, fall through to step 3.
  3. Otherwise, download it with the existing PNG toast.

**Pre-render.**
- While the Export panel is open, the PNG is rendered ahead of time: when the panel opens, and again (debounced) when the scale, credit or artwork changes.
- Share uses that ready image, so a click never waits on rendering. Waiting would break the share sheet (the tap stops counting) and the clipboard (Safari needs the write inside the click).
- The button shows "Preparing…" and stays disabled until the image is ready.

**Placement.**
- Share goes next to Export PNG in the editor's Export panel (settings → Export). That menu entry becomes "Export & share".
- A toolbar shortcut is deferred until PostHog shows whether people use Share.

**Analytics.**
- `export_png` gains `{ scale, credit }`.
- New event: `share` `{ method: "native" | "clipboard" | "download", scale, credit }`.

**File names.** Unchanged except for a scale suffix at ×2 and above: `my-art@8x.png`.

## PR order

1. **Scaled PNG export.** New renderer, scale picker, size cap, remembered scale, `export_png { scale }`.
2. **Credit strip.** Strip renderer, switch, remembered choice, `export_png { credit }`.
3. **Share.** Pre-rendered PNG, the Share button with its three fallbacks, the "Export & share" rename, the `share` event, README.

Each PR updates `README.md` (Features) where the behaviour changes.

## Left to the builder

- Exact strip padding and font size, within "legible on a phone feed" and the height rule above.
- Component and hook names, and the layout of the scale picker (segmented buttons or a select), within the design system.
- Test layout, following the existing `*.test.ts` patterns.
