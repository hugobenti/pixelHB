# PixelHB editor: color picker

Status: draft for Hugo's approval (Oct 23, 2026).
Scope: a color picker (eyedropper) tool in the editor at `/editor/[id]`. Mockups: `.superpowers/brainstorm/43026-1792759938/content/picker-loupe-v2.html` (split-ring variant).

## Why

With a large palette, finding the swatch for a color already on the canvas means scanning the palette row by eye. Hugo: "I got a large palette, and I don't want to search in the palette for the color I'm seeing." The picker lets the artist point at the color on the canvas and get that palette entry as the paint color.

Success: while drawing, the artist arms the picker, presses on the canvas, drags until the loupe shows the color they want, releases, and is drawing with it, without looking at the palette row. At every moment before release they can tell what they will get, and releasing anywhere that has nothing to pick changes nothing.

## Goals

1. A picker toggle in the toolbar, right after the paint bucket.
2. Press-and-hold-and-drag picking with a live loupe; the color is applied on release only.
3. A clear "nothing to pick" state for empty spots and for leaving the canvas, with release there changing nothing.
4. After a successful pick, the artist is back to drawing.

## Non-goals

- Picking colors that are not in the palette (from the reference image, or from outside the browser via the EyeDropper API). Every artwork pixel already stores a palette index, so the picker always lands on an existing swatch.
- Showing the color's name or hex while picking (Hugo: they "don't help at all").
- A phone bottom dock. The editor has no phone-specific toolbar yet (`docs/design/improvement-plan.md` PR 5); the picker button lives in the same wrapping toolbar as the other tools.
- Keyboard-only picking (moving a pick cursor with the arrow keys).

## Anti-goals (failures even if it ships)

- A pick applied on press or while dragging. Only release applies it.
- Release over an empty spot or off the canvas changing the paint color, the slot or the palette row selection.
- A pick that changes pixels or adds an undo step.
- A loupe that hides the pixel being picked under the pointer or the finger.
- A loupe whose ring disappears against the canvas (for example a white ring on a white background).

## Decided by Hugo

- **Entry:** a toolbar button next to the bucket, plus a key to hold on desktop for a quick pick mid-drawing (Hugo agreed to "a picker button in the toolbar … plus a key to hold on desktop").
- **Gesture:** press and hold on the canvas, drag to look around, release to pick. The color under the pointer is previewed next to the pointer while held.
- **Release rules:** release over a color picks it. Release off the canvas does nothing. Release over an empty spot does nothing (Hugo: "makes sense, make the rule").
- **After a pick:** back to drawing.
- **Preview:** a round magnifier loupe showing the pixels around the pointer with the target pixel marked in the middle. No color name, no hex.
- **Ring:** the loupe has a thick ring split horizontally: the top half is the color under the pointer, the bottom half is the current paint color. This lets the artist compare the two before letting go (the same idea as Procreate's eyedropper).

## Behavior

### Terms

- **Paint slot:** the slot a pick writes to. With the left button or touch, it is the active slot (`Primary` or `Secondary`, the color-pair chip). With the right mouse button it is the other slot, matching how the right button paints with the other slot today (`paletteIndexForButtons` in `usePixelPainting.ts`).
- **Target pixel:** the artwork pixel under the pointer, `screenToWorldCoordinates` on the artwork canvas, the same mapping painting uses.
- **Picked index:** `compositeOpaquePaletteIndexAt(artwork, x, y)` (`logic/visibleCompositePixelCounts.ts`): the topmost visible layer's palette index at the target pixel, or `null`.
- **Empty spot:** the picked index is `null`. That covers a target outside the artwork bounds and a pixel where every visible layer is transparent (index at or above the palette length, `TRANSPARENT_PIXEL_INDEX`). Hidden layers are ignored: the picker picks what the artist sees.
- **Off the canvas:** the pointer is outside the artwork canvas element's bounding box (on the toolbar, the palette row, a drawer, outside the window).

### Arming

- The picker button is a toggle using `IconButton` with `pressed`, like pan and bucket.
- The tools are mutually exclusive: arming the picker turns off pan mode, bucket mode and the eraser, and arming pan, bucket or the eraser disarms the picker. The workspace already clears pan/bucket pairwise in `togglePanMode` / `toggleBucketMode`; the picker joins that.
- The picker remembers which paint tool was on when it was armed: brush (no mode), bucket or eraser. Arming it while pan mode is on remembers brush; pan mode is never restored.
- Disarming without picking: press the button again, or press `Escape` while armed and not holding. Either returns to the remembered paint tool.
- **Quick pick (desktop):** while `Alt` (`Option` on macOS) is held and the editor claims keys (same rule as Space for pan: viewport focused, or the body focused with the pointer over the canvas, `shouldClaimSpaceForCanvasPan`), a press on the canvas starts a pick hold even when the picker is not armed. Releasing applies the same release rules; the tool that was on (brush or bucket) stays on. The exception is the eraser: a quick pick turns it off, back to the brush, because picking a color means you want to paint. The toolbar button shows pressed while `Alt` is held. Key choice is my call: Alt is the eyedropper modifier in Aseprite and Photoshop.
  - `Alt` only decides whether a press starts a hold. Once a hold has started, releasing `Alt` does not end it; the pointer release does.
  - With the picker already armed, `Alt` changes nothing: the button stays pressed, `Escape` and the remembered tool behave as above.
  - Pan wins over quick pick, as it wins over painting: with pan mode on, Space held or the middle button, `Alt` plus a press pans.
- While armed, the canvas cursor is the crosshair it already uses.

### Holding

- A left-button, right-button or single-touch press on the artwork canvas while armed starts a pick hold. The press neither paints nor fills.
- Pan keeps priority, as for painting: with Space held, middle button, or a second touch, the gesture pans and no pick starts. A second touch landing during a hold cancels the hold (same as a stroke ends today), and the picker stays armed.
- The hidden-active-layer guard does not apply: picking reads the composite and works when the active layer is hidden. No "hidden layer" toast.
- While holding, on every pointer move:
  - **Over a color:** the loupe follows the pointer; the target pixel gets an outline on the canvas; the palette row moves its marker to the picked index and scrolls that swatch into view.
  - **Over an empty spot:** the loupe follows the pointer and shows the empty cells as checkerboard; the top half of the ring is checkerboard; the target pixel outline shows only when the target is inside the artwork; the palette row marker returns to where it was before the hold.
  - **Off the canvas:** the loupe and the pixel outline hide; a small pill next to the pointer reads "Release to cancel"; the palette row marker returns to where it was before the hold.
- Nothing about the artwork, the slots or the history changes while holding.

### Releasing

- **Over a color:** the picked index is assigned to the paint slot, exactly as clicking that swatch in the palette row (`assignSwatchToActiveSlot`, or the other slot for a right-button hold). The palette row marker stays on it. The picker disarms and the remembered paint tool comes back (brush, or bucket if the picker was armed from bucket). After a quick pick, the picker was never armed, so nothing disarms.
- **Over an empty spot or off the canvas:** nothing changes. The palette row marker returns to where it was before the hold. The picker stays armed so the artist can try again.
- **`Escape` during a hold, `pointercancel`, a second touch, or the window losing focus:** the hold ends like a release off the canvas.
- No undo entry in any case: palette slot selection is not part of the history today.

### The loupe

- A circle that magnifies a 5 × 5 block of artwork pixels centered on the target pixel, drawn from the composite of visible layers. Cells outside the artwork or transparent in every visible layer render as the transparency checkerboard (`checker-light` / `checker-dark`).
- The center cell has the same black-and-white outline as the pixel outline on the canvas.
- A thick ring (12px in the mockup) around the circle, split horizontally: top half = picked color (checkerboard when empty), bottom half = current color of the paint slot.
- Thin black and white edges inside and outside the ring keep it visible on any canvas color, in both themes.
- Placement: above and to the right of the pointer, with a gap, so neither the cursor nor a finger covers it. When that would leave the viewport, it flips to the other side horizontally and/or vertically. On touch, the gap above the finger is larger than for a mouse.
- It renders above the canvas and above the header (the palette row and toolbar), since a drag near the top of the canvas would otherwise clip it. The canvas shell is `overflow-hidden`, so the loupe cannot live inside `CanvasContainer`.
- It never takes pointer events and is hidden from assistive technology.

### The palette row marker

- While holding over a color, the swatch for the picked index shows the existing roving-focus marker (`ColorSwatch` `isFocused`: 2px dashed `focus` outline) and is scrolled into view within the row's horizontal scroller.
- Rationale: on release that swatch becomes the focused one anyway (`assignSwatchToActiveSlot` sets `focusedSwatchIndex`), so the hold previews the end state with the existing marker rather than adding a second dashed style that DESIGN.md would have to tell apart from it.

### Copy

- Toolbar control: label "Color picker" (also the tooltip, through `IconButton`).
- Off-canvas pill: "Release to cancel".
- Help page: one short entry describing press, drag, release, and that releasing on an empty spot or outside the canvas cancels.

## Constraints

- Repo rules in `AGENTS.md`: `.tsx` files are presentation only; logic in `useX.ts` hooks on pure `.ts` modules in `features/editor/logic`; classes in `X.style.ts`; types in `X.type.ts`; copy in `src/content`. ESLint bans arithmetic and template literals in `.tsx`, so loupe positions and cell colors are computed in the hook.
- The editor must not import the gallery; anything shared goes to `features/shared`.
- New icon: `public/icons/` SVG following the icon rules enforced by `publicIcons.test.ts` (24 × 24 viewBox, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, no hex colors), registered in `PUBLIC_ICONS`.
- Tests run in Vitest's node environment with no DOM library; testable logic must be DOM-free.
- Both themes: the loupe's surface edges and checkerboard use the existing tokens; a new token, if any, gets a dark value and a contrast-pair entry in `tokenContrast.test.ts`.
- Artworks go up to 1000 × 1000. Per-move work is a 5 × 5 composite lookup, not a full composite.

## Docs to update

- `README.md`: editor features and the shortcuts table (hold `Alt` / `Option` to pick).
- `DESIGN.md`: IconButton toggles list (pan, bucket, picker); icon meanings; the loupe as a floating element; the palette row marker during a hold.
- `PRODUCT.md`: editor surfaces list mentions tools; add the picker.
- `src/features/editor/docs/canvas-pointer-contract.md`: the pick hold in the pointer rules.
- `src/content/help.ts`: the help entry above, plus a `shortcuts` row for hold `Alt` / `Option`. The help shortcut `effect` union and `src/content/help.test.ts` (which asserts the exact set of effects against the key handling) gain a picker effect.
- `IconButton` tooltip: `editor.toolbar.picker` gets `shortcut: "hold Alt"` like pan's `"hold Space"`.
- `usePixelPainting.ts` header comment, if the pick hold lives there.

## Left to the builder

- Where the hold logic lives: inside `usePixelPainting` (alongside the bucket branch) or a separate `useColorPicker` hook sharing the pointer contract. The rules above hold either way.
- How the 5 × 5 loupe is drawn (a small canvas, or 25 cells) and how the canvas pixel outline is drawn (DOM element positioned from the viewport, or a canvas overlay).
- The eyedropper icon artwork, within the icon rules.
- Exact loupe gaps, cell size and ring thickness, starting from the mockup (18px cells, 12px ring).
- Whether `Escape` handling joins an existing keydown handler or gets its own.
