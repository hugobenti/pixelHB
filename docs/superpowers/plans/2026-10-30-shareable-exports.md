# Shareable Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared PixelHB artwork advertise the app. That means a sharp upscaled PNG export, a "Made with PixelHB" credit strip that is on by default, and a Share action, delivered as three independent PRs.

**Architecture:**
- **Pure logic** lives in `.ts` modules, each with Vitest tests:
  - compositing to RGBA
  - scale/size limits
  - strip layout
  - stored preferences
  - share fallback order
- **The DOM renderer** stays in `artworkFileService.ts`. It composes once at 1×, draws scaled with smoothing off, then appends the strip.
- **Behaviour** goes in the editor's `useImportExportPanel` hook, and the panel `.tsx` stays presentation only.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Canvas 2D, Web Share API Level 2, Async Clipboard API, PostHog (`capture()`).

**Spec:** `docs/superpowers/specs/2026-10-30-shareable-exports-design.md`

## Global Constraints

- Follow `AGENTS.md` (read it first):
  - `.tsx` files are presentation only; behaviour goes in `useX.ts`, classes in `X.style.ts` via `cx()`, types in `X.type.ts` (`I`/`T` prefixes).
  - All copy goes in `src/content` (typed in `content.type.ts`).
  - Shared code must not import editor code.
- **One PR per section below** (PR 1 → PR 2 → PR 3). Each PR starts on a new branch from an up-to-date `main` and keeps to ≤ ~20 files. Each PR must pass `npm run lint`, `npm run typecheck`, `npm test` and `NEXT_DIST_DIR=.next-verify npm run build`. Never touch `.next`.
- Scales: `[1, 4, 8, 16, 32]`. Cap: **4096 px** on the long edge, credit strip included.
- **Default scale:** the smallest allowed scale whose long edge is ≥ 1024. If none qualifies, the largest allowed scale.
- **Credit strip:**
  - height = `max(32, round(exportWidth × 0.08))`
  - no strip when `exportWidth < 256`
  - on by default
  - drawn **below** the art, never over it
- localStorage keys: `pixelhb.exportScale` and `pixelhb.exportCredit`. A storage error falls back to the defaults.
- File name: `<sanitized-title>.png` at ×1, `<sanitized-title>@<n>x.png` above ×1.
- Palette entries are opaque `#rrggbb` (`HEX_COLOR` in `artworkFileFormat.ts`). A pixel index ≥ `palette.length` is transparent. `layers[0]` is the top layer (today's renderer paints the last layer first).
- **Share** passes files only (`navigator.share({ files })`), with no `text`/`url`. Order of attempts: native → clipboard → download. `AbortError` means the user cancelled: no toast, no event.
- **Analytics:**
  - `export_png: { scale; credit }`
  - `share: { method: "native" | "clipboard" | "download"; scale; credit }`
  - `credit` means **a strip was drawn**. Properties never carry names, pixels or palettes.
- The URL text in the strip is `new URL(site.url).host`.

## Review Focus

1. **A 1000×1000 artwork with the credit on.** ×4 would be 4000 + 320 = 4320 px tall, so it must be disabled and only ×1 offered. With the credit off, ×4 becomes allowed. (Task 1 + Task 3 tests.)
2. **A stored scale that is too big for the artwork now open** (e.g. ×32 remembered from a 16×16 sprite, now on a 500×500). It must fall back to the default, never export above the cap. (Task 1 test.)
3. **Share after a slow render** can lose the browser's user activation. `navigator.share` then rejects with `NotAllowedError`, which must fall back to download, not show an error. (Task 4 test.)
4. **Safari clipboard:** the `ClipboardItem` has to be built with a `Promise<Blob>` synchronously inside the click. Awaiting the render first fails on Safari. (Task 4 step.)
5. **All layers hidden, or every pixel transparent:** the export still produces a transparent PNG of the right size, and the strip is still drawn. (Task 1 composite test, Task 3 renderer smoke.)

---

## PR 1: Scaled PNG export

### Task 1: Composite, scale limits, file name, stored scale (pure logic)

**Files:**
- Create: `src/features/shared/artwork/artworkComposite.ts`, `artworkComposite.test.ts`
- Create: `src/features/shared/artwork/exportScale.ts`, `exportScale.type.ts`, `exportScale.test.ts`
- Create: `src/features/shared/artwork/exportPreferences.ts`, `exportPreferences.test.ts`
- Create: `src/features/shared/artwork/artworkFileName.ts`, `artworkFileName.test.ts` (move `sanitizeFileNameSegment` here from `artworkFileService.ts`)

**Interfaces (produces):**
- `composeArtworkRgba(artwork: Pick<IArtwork, "width" | "height" | "layers" | "palette">): Uint8ClampedArray`: RGBA at 1×, length `w*h*4`.
- `EXPORT_SCALES: readonly [1, 4, 8, 16, 32]`, `type TExportScale = (typeof EXPORT_SCALES)[number]`, `MAX_EXPORT_EDGE_PX = 4096`.
- `exportSize(art: { width: number; height: number }, scale: TExportScale, stripHeight: (exportWidth: number) => number): { width: number; height: number; artHeight: number }`.
  - PR 1 passes `() => 0`; PR 2 passes `creditStripHeight`.
- `allowedExportScales(art, stripHeight): TExportScale[]`
- `defaultExportScale(art, stripHeight): TExportScale`
- `resolveExportScale(stored: TExportScale | null, art, stripHeight): TExportScale`
- `exportFileName(title: string, scale: TExportScale): string`
- `EXPORT_SCALE_KEY = "pixelhb.exportScale"`, `parseExportScale(raw: string | null): TExportScale | null`

- [ ] **Step 1: Write the failing tests**
  - `artworkComposite.test.ts`:
    - `"takes the top visible layer's colour"`: `layers[0]` index 1 (`#ff0000`) over `layers[1]` index 2 → `[255,0,0,255]`.
    - `"skips hidden layers"`
    - `"index beyond the palette is transparent"` → `[0,0,0,0]`
    - `"all layers hidden gives a fully transparent buffer of w*h*4"`
  - `exportScale.test.ts`:
    - `allowedExportScales({width:1000,height:1000}, () => 0)` → `[1, 4]`.
    - With `w => Math.max(32, Math.round(w * 0.08))` → `[1]`.
    - `defaultExportScale({width:32,height:32}, () => 0)` → `32` (32 px art × 32 = 1024).
    - `defaultExportScale({width:64,height:16}, () => 0)` → `16` (64 × 16 = 1024).
    - `defaultExportScale({width:1000,height:1000}, () => 0)` → `4` (none reaches 1024 below the cap except ×4 = 4000).
    - `resolveExportScale(32, {width:500,height:500}, () => 0)` → the default (`4`).
    - `resolveExportScale(null, …)` → the default.
    - `exportFileName("My Art", 1)` → `"my-art.png"`; `exportFileName("My Art", 8)` → `"my-art@8x.png"`; `exportFileName("  ", 4)` → `"artwork@4x.png"`.
  - `exportPreferences.test.ts`: `parseExportScale("8")` → `8`; `"3"`, `"abc"` and `null` → `null`.
- [ ] **Step 2: Run them; expect FAIL (modules missing):** `npx vitest run src/features/shared/artwork`.
- [ ] **Step 3: Implement the four modules.** `composeArtworkRgba` parses each palette hex once into RGB, then for each pixel takes the first visible layer (from index 0) whose index is in range.
- [ ] **Step 4: Run them; expect PASS.**
- [ ] **Step 5: Commit** `feat(export): RGBA composite, export scale limits and file names`.

### Task 2: Scaled renderer, scale picker, `export_png { scale }`

**Files:**
- Modify: `src/features/shared/artwork/artworkFileService.ts` (replace `drawArtworkToCanvas` with an `ImageData` composite drawn scaled; `exportArtworkAsPng` takes options)
- Modify: `src/features/shared/artwork/thumbnail.ts` only if it shares `drawArtworkToCanvas`; otherwise leave it alone
- Modify: `src/features/editor/components/EditorSettingsDrawer/hooks/useImportExportPanel.ts` + `.type.ts`, `useEditorSettingsDrawer.ts`
- Modify: `EditorSettingsImportExportPanel.tsx` / `.style.ts` / `.type.ts` (a segmented scale picker built from `ButtonGroup` + `Button`)
- Modify: `src/content/editor.ts`, `src/content/content.type.ts`
- Modify: `src/features/shared/analytics/analytics.type.ts` (`export_png: { scale: TExportScale; credit: boolean }`, with `credit: false` until PR 2)
- Modify: `README.md` (Features: export scale)

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `exportArtworkAsPng(artwork: IArtwork, options: { scale: TExportScale; credit: boolean }): Promise<{ credit: boolean }>`
  - `renderArtworkPng(artwork, options): Promise<{ blob: Blob; credit: boolean; fileName: string }>`. Task 4 reuses it.
  - `useImportExportPanel` returns `{ exportPng, exportJson, scale, scaleOptions: { scale: TExportScale; label: string; pressed: boolean; disabled: boolean }[], selectScale(scale) }`.
- **Copy:**
  - `editor.settings.export.scaleLabel: "Size"`
  - `scaleOption(scale, w, h)` → `"×8 · 256 × 256"`
  - `scaleTooLarge: "Too large to export"`, used as the disabled option's accessible description.

- [ ] **Step 1: Implement `renderArtworkPng`.**
  - `composeArtworkRgba` → `putImageData` on a 1× canvas.
  - Then draw it into a canvas of `exportSize(...)` with `imageSmoothingEnabled = false`.
  - Then `toBlob("image/png")`, keeping the existing `toDataURL` fallback path.
- [ ] **Step 2: Wire the hook.**
  - Read the stored scale with `parseExportScale` + `resolveExportScale`, inside a `try` around localStorage.
  - Persist on `selectScale`.
  - Call `capture("export_png", { scale, credit: false })` after a successful export.
- [ ] **Step 3: Render the picker** in the panel above the Export buttons, with `aria-pressed` on the selected option and `disabled` on options that are too large.
- [ ] **Step 4: Verify.**
  - Run `npm run lint && npm run typecheck && npm test`; expect all green.
  - Run an isolated build and `NEXT_DIST_DIR=.next-verify npm start -- -p 3125`.
  - **32×32 artwork:** the picker defaults to ×32 and the exported file is 1024×1024 with sharp pixels.
  - **1000×1000 artwork:** offers ×1 and ×4 only.
  - **×1 output** is pixel-identical to an export from `main` of the same artwork. Compare them in the browser with `getImageData`.
- [ ] **Step 5: Commit** `feat(export): choose PNG export size with sharp upscaling`, then open the PR.

---

## PR 2: "Made with PixelHB" credit strip

### Task 3: Strip layout + renderer + switch

**Files:**
- Create: `src/features/shared/artwork/creditStrip.ts`, `creditStrip.type.ts`, `creditStrip.test.ts` (pure layout)
- Create: `src/features/shared/artwork/creditStripRender.ts` (canvas drawing; DOM)
- Modify: `exportPreferences.ts` + test (`EXPORT_CREDIT_KEY = "pixelhb.exportCredit"`, `parseExportCredit(raw): boolean`, where `"off"` → `false` and anything else → `true`)
- Modify: `artworkFileService.ts` (`renderArtworkPng` appends the strip when `credit && exportWidth >= 256` and returns `credit` as drawn)
- Modify: `useImportExportPanel.ts` + `.type.ts`, `EditorSettingsImportExportPanel.tsx` / `.type.ts` (`Switch`)
- Modify: `src/content/editor.ts`, `content.type.ts`, `README.md`

**Interfaces:**
- Produces:
  - `CREDIT_MIN_EXPORT_WIDTH = 256`
  - `creditStripHeight(exportWidth: number): number`, which returns `0` below the minimum
  - `creditStripLayout(exportWidth: number): { height: number; cellPx: number; wordmark: { x: number; y: number }; host: { x: number; baselineY: number; fontPx: number } }`
  - `drawCreditStrip(ctx: CanvasRenderingContext2D, top: number, layout, host: string): Promise<void>`. It awaits `document.fonts.load` for the app's sans family, read from the `--font-sans` CSS variable.
- The hook adds `{ credit: boolean; setCredit(on: boolean): void; creditHint: string | null }`. `creditHint` is shown when the chosen export width is < 256.
- `scaleOptions` and `exportSize` now use `credit ? creditStripHeight : () => 0`.
- **Copy:**
  - `editor.settings.export.credit.label: "Add “Made with PixelHB”"`
  - `credit.hint: "A small strip with the PixelHB logo and link, below your art."`
  - `credit.tooNarrow: "Pick a larger size to add the strip (needs 256 px width)."`

- [ ] **Step 1: Write the failing tests** (`creditStrip.test.ts`).
  - `creditStripHeight(255)` → `0`; `(256)` → `32`; `(1024)` → `82`; `(4096)` → `328`.
  - `creditStripLayout(1024)`:
    - `wordmark.x + 37 * cellPx < host.x` (no overlap)
    - `wordmark.y + 7 * cellPx <= height`
    - `host.fontPx >= 12`
  - `allowedExportScales({width:1000,height:1000}, creditStripHeight)` → `[1]`.
  - `parseExportCredit(null)` → `true`.
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement the layout, then the renderer.** Draw the wordmark from `gridRuns(WORDMARK_GRID)`, coloured with `BRAND_STATIC_THEME_COLORS`. The background is the brand's light paper colour from `brandArt.ts`; add no new hex literal.
- [ ] **Step 4: Wire the switch.** Persist it, and call `capture("export_png", { scale, credit })` with the drawn value.
- [ ] **Step 5: Verify.**
  - Run lint, typecheck, test and the isolated build.
  - **32×32 at ×32:** the PNG is 1024 × (1024 + 82) and the strip reads "PixelHB … pixelhb.vercel.app" on a phone-width screenshot.
  - **Switch off:** the PNG is 1024 × 1024, and the choice is remembered after a reload.
  - **×1 on 32×32:** no strip, and the switch shows the too-narrow hint.
- [ ] **Step 6: Commit** `feat(export): "Made with PixelHB" credit strip, on by default`, then open the PR.

---

## PR 3: Share

### Task 4: Share action with fallbacks

**Files:**
- Create: `src/features/shared/artwork/shareImage.ts`, `shareImage.type.ts`, `shareImage.test.ts`
- Modify: `useImportExportPanel.ts` + `.type.ts`, `useEditorSettingsDrawer.ts`, `EditorSettingsImportExportPanel.tsx` (Share button, primary variant, first in the actions row)
- Modify: `src/content/editor.ts` (`menu.export.label: "Export & share"`; `export.share: "Share image"`; `export.copied: "Image copied. Paste it anywhere."`; `export.shareFailed`), `content.type.ts`
- Modify: `analytics.type.ts` (`share: { method: TShareMethod; scale: TExportScale; credit: boolean }`), `README.md`

**Interfaces:**
- `type TShareMethod = "native" | "clipboard" | "download"`
- `shareImage(image: { blob: Promise<Blob>; fileName: string }, env: IShareEnv): Promise<TShareMethod | "cancelled">`
- `IShareEnv`: `{ canShare?(data: ShareData): boolean; share?(data: ShareData): Promise<void>; writeClipboard?(item: ClipboardItem): Promise<void>; makeClipboardItem?(blob: Promise<Blob>): ClipboardItem; download(blob: Blob, fileName: string): void }`. The hook builds it from `navigator`, `ClipboardItem` and the existing download helper (export `triggerFileDownload`).
- **Order:**
  1. If `canShare({ files: [probe] })` is true, call `share({ files: [file] })`. `AbortError` → `"cancelled"`. `NotAllowedError` → download.
  2. Otherwise, if clipboard functions exist, build the item **synchronously** from the blob promise, then write it. If the write fails, download.
  3. Otherwise, download.
- **Probing `canShare`:** it needs a `File`, so when `canShare` exists, the hook awaits the render first. On Safari, the clipboard path must be entered before any `await`. If `canShare` is absent, go straight to the clipboard.

- [ ] **Step 1: Write the failing tests** with fake envs:
  - `"uses the share sheet when files can be shared"` → `"native"`, and `share` is called with `{ files: [File named fileName] }` and nothing else.
  - `"AbortError returns cancelled and does not download"`
  - `"NotAllowedError falls back to download"`
  - `"no canShare: copies to clipboard"` → `"clipboard"`, and `makeClipboardItem` is called before the blob resolves.
  - `"clipboard write rejects: downloads"`
  - `"nothing available: downloads"`
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement `shareImage`**, then the hook's `share()`.
  - `"native"` → no toast. `"clipboard"` → the `copied` toast. `"download"` → the existing PNG-done toast. `"cancelled"` → nothing.
  - Call `capture("share", { method, scale, credit })` unless the result is cancelled.
- [ ] **Step 4: Verify.**
  - Run lint, typecheck, test and the isolated build.
  - **Desktop Chrome via the browser tool:** Share copies the image (check with `clipboardRead` or a toast).
  - **Phone emulation (390×844):** the button is reachable and labelled, and the settings menu reads "Export & share".
  - Report that the native sheet is only exercised by the unit tests unless a real phone is available.
- [ ] **Step 5: Commit** `feat(export): share the image from the editor`, then open the PR.
