# Technical Design Document (TDD) — PixelHB Engine

This document specifies the architecture, data structures, and implementation details for PixelHB, a high-performance web-based Pixel Art editor capable of handling matrices up to $1000 \times 1000$ efficiently.

---

## 1. Architectural Design & Folder Structure

The project utilizes a Feature-Driven Clean Architecture combined with Next.js App Router. This design strictly segregates UI components, business/domain logic, and infrastructure/storage layers.

```plaintext
src/
├── app/                        # Next.js App Router (Routing & Layouts)
│   ├── page.tsx                # Application Entry (Redirects to /gallery)
│   ├── gallery/                # Gallery Feature Route
│   │   └── page.tsx
│   └── editor/                 # Canvas Editor Feature Route
│       └── [id]/
│           └── page.tsx
├── features/                   # Feature Domain Isolation
│   ├── gallery/                # Gallery Domain
│   │   ├── components/         # GalleryGrid.tsx, ArtworkCard.tsx, CreateArtworkModal.tsx
│   │   ├── hooks/              # useCreateArtworkForm.ts, useGalleryImport.ts
│   │   └── store/              # useGalleryStore.ts (State management for UI)
│   ├── editor/                 # Canvas Engine Domain
│   │   ├── components/         # CanvasContainer.tsx, PaletteBar.tsx, ToolBar.tsx, PixelGridOverlay.tsx
│   │   ├── hooks/              # useCanvasEngine.ts, useHistory.ts, useZoomPan.ts
│   │   ├── logic/              # coordinateMath.ts, pixelBuffer.ts, gridRender.ts
│   │   └── types/              # editor.type.ts (viewport + undo history)
│   └── shared/                 # Shared Kernel / Global App Infrastructure
│       ├── artwork/            # artwork.type.ts, artworkService.ts (Dexie.js persistence + limits), artworkFileService.ts (JSON/PNG import/export)
│       ├── components/         # Primitive UI atoms (Button.tsx, Input.tsx - Pure Tailwind)
│       ├── auth/               # Auth.js session, account control, sign-out wipe marker
│       ├── db/                 # dexie.config.ts (IndexedDB Schema setup, v4)
│       ├── drive/              # Drive client + stateless gallery API proxy (server/)
│       ├── sync/               # sync engine and the hooks that drive it
│       └── utils/              # colorConverter.ts, binaryHelpers.ts
```

---

## 2. Data Architecture & Storage Strategy

Handling a $1000 \times 1000$ canvas means managing 1,000,000 pixels. Storing raw HEX string arrays is highly inefficient (consuming roughly 16MB of RAM per artwork state).

### The Solution: Indexed Palette Storage

We optimize memory layout by saving data into a flat, typed array (`Uint8Array`), where each byte acts as a pointer index pointing to an item in a localized color palette array.

| Constraint | Detail |
| --- | --- |
| **Memory impact** | A $1000 \times 1000$ grid using `Uint8Array` takes exactly 1.00MB of raw memory. |
| **Palette constraint** | `Uint8Array` supports up to 256 colors per document, which is more than sufficient for standard pixel art workflows. |

### IndexedDB Database Schema (via Dexie.js, v4)

```typescript
// features/shared/db/dexie.config.ts
artworks: "id, updatedAt, title, ownerId"
deletions: "id, ownerId"
```

```typescript
// features/shared/artwork/artwork.type.ts + artworkSync.type.ts

export interface IArtwork {
  id: string;               // UUID v4 Primary Key
  title: string;
  width: number;            // Up to 1000
  height: number;           // Up to 1000
  createdAt: number;        // Epoch timestamp
  updatedAt: number;        // Epoch timestamp
  thumbnail: string;        // Small preview data URL for quick gallery loads
  palette: string[];        // Indexed color map. Max 256 strings (e.g. ["#000000", "#FFFFFF"])
  layers: IArtworkLayer[];  // { id, name, visible, pixelData: Uint8Array (width * height) }
  activeLayerId: string;
  referenceImageDataUrl?: string; // Optional guide image overlay
}

export interface IStoredArtwork extends IArtwork {
  ownerId: string | null;   // Google account that owns the copy; null = signed out
  sync: {
    state: "local" | "dirty" | "synced" | "tooLarge";
    syncedUpdatedAt: number | null; // updatedAt last confirmed in Drive
  };
}

export interface IArtworkDeletion { // tombstone: deleted locally after it had synced
  id: string;
  ownerId: string;
  deletedAt: number;
}
```

### File format (v3)

Export JSON and the files stored in Drive share one format: `version: 3`, `id`, `createdAt`, `updatedAt`, `title`, `width`, `height`, `palette`, `layers` (each `{ id, name, visible, pixelDataBase64 }`), `activeLayerId` and an optional `referenceImageDataUrl`. Versions 1 and 2 are still imported.

### Sync model (signed in, optional)

Drive sync is behind `NEXT_PUBLIC_DRIVE_SYNC`. `/api/gallery` route handlers are stateless proxies to the Drive `drive.file` scope; nothing is stored server-side.

- IndexedDB is always the local working copy; the editor never waits on the network.
- Dirty artworks are pushed to the `PixelHB` Drive folder, oldest first, about ten seconds after the last edit.
- Pulling lists the Drive folder first, then downloads only artworks that are new or newer.
- The latest `updatedAt` wins; on a tie, Drive wins.
- Deleting a synced artwork leaves a tombstone in `deletions` until Drive confirms it; signing out removes that account's rows from the browser (after offering to download unsynced ones). Artworks too large for Drive are marked `tooLarge` and stay local.

---

## 3. The Canvas Engine Module

The engine uses an HTML5 `<canvas>` element driven entirely by structural variables (the Camera Viewport Matrix) instead of native CSS properties to maintain perfect pixel scaling (pixelated rendering) during Zoom and Pan.

### Viewport Transformation Equation

The Canvas Context 2D pipeline coordinates map directly via the transformation matrix:

$$
\begin{bmatrix} X_{canvas} \\ Y_{canvas} \end{bmatrix} = \begin{bmatrix} \text{scale} & 0 \\ 0 & \text{scale} \end{bmatrix} \begin{bmatrix} X_{world} \\ Y_{world} \end{bmatrix} + \begin{bmatrix} \text{viewOffset.x} \\ \text{viewOffset.y} \end{bmatrix}
$$

```typescript
// features/editor/logic/coordinateMath.ts

export interface ViewportState {
  scale: number;
  viewOffset: { x: number; y: number };
}

/**
 * Maps Screen Coordinate (Mouse Click) into the Grid Pixel index coordinate
 */
export function screenToWorldCoordinates(
  mouseX: number,
  mouseY: number,
  viewport: ViewportState
): { x: number; y: number } {
  const worldX = Math.floor((mouseX - viewport.viewOffset.x) / viewport.scale);
  const worldY = Math.floor((mouseY - viewport.viewOffset.y) / viewport.scale);
  return { x: worldX, y: worldY };
}
```

### Canvas Draw Implementation Loop

All operations should render within a `requestAnimationFrame` render loop when active movement or canvas alterations happen.

```typescript
// features/editor/hooks/useCanvasEngine.ts

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  artwork: Artwork,
  viewport: ViewportState
) {
  const { width, height, pixelData, palette } = artwork;

  // Clear layout boundaries
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  // Disable image smoothing to prevent anti-aliasing artifacts
  ctx.imageSmoothingEnabled = false;

  // Apply World Transformation
  ctx.translate(viewport.viewOffset.x, viewport.viewOffset.y);
  ctx.scale(viewport.scale, viewport.scale);

  // Render Loop
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = x + y * width;
      const paletteIndex = pixelData[pixelIndex];
      const color = palette[paletteIndex] || "transparent";

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.restore();
}
```

### Pixel Grid Overlay (Artist Aid)

Pixel art editing requires a **per-pixel grid** so the artist can see cell boundaries while drawing. This is **not** the same as the **checkerboard transparency pattern** (Section 5): the grid is an optional editorial overlay; the checkerboard only suggests empty/alpha areas behind the artwork.

#### UX Requirements

- **Toggle:** The user must be able to **show or hide** the pixel grid (toolbar toggle, keyboard shortcut, or both) without affecting the artwork buffer or undo history.
- **Alignment:** Grid lines must sit **exactly** on pixel boundaries as rendered by the artwork layer at every zoom/pan state—no sub-pixel drift between layers.

#### Why a Separate Overlay Layer

Rendering the grid on a **second surface** stacked above the artwork canvas keeps concerns separated:

| Concern | Artwork canvas | Grid overlay |
| --- | --- | --- |
| **Invalidation** | Runs when `pixelData`, palette, or document size changes | Runs when viewport, grid visibility, or grid styling changes |
| **Content** | Up to 1M fills per full redraw | Strokes along integer world lines (can be culled to the visible world rect) |
| **Toggle** | N/A | Hide via CSS/dispatch skip draw—no need to repaint all pixels |

A dedicated overlay avoids mixing grid strokes with pixel fills in one raster pass and simplifies **toggle** (skip overlay draw or `visibility`/`opacity` without touching the artwork bitmap).

**Recommended stack:** a `position: relative` wrapper containing (1) artwork `<canvas>` (bottom), (2) grid `<canvas>` (top). Both elements share the **same CSS box size** (the interactive viewport’s display size in CSS pixels) and the **same backing-store dimensions** (`width`/`height` attributes match between the two canvases so one device pixel maps consistently).

#### Alignment Rules (Critical)

1. **Single source of truth for camera:** `ViewportState` (scale + `viewOffset`) must drive **both** layers. Do not express one layer in CSS `transform` and the other only in canvas matrix math unless the math is provably identical—prefer **the same sequence** as in `renderCanvas`: `ctx.translate(viewOffset)` then `ctx.scale(scale)` (or an equivalent shared helper used by both renderers).
2. **World space:** Draw grid lines in **world coordinates** (integers $0 \ldots \text{width}$ and $0 \ldots \text{height}$) using the same transform as pixel `fillRect(x, y, 1, 1)`, so lines coincide with pixel edges.
3. **Crisp strokes:** With `imageSmoothingEnabled = false`, use stroke coordinates aligned to the same grid (e.g. lines at $x = 0, 1, 2, \ldots$); adjust by half a device pixel where needed so 1px strokes stay sharp at minimum zoom.
4. **Hit testing:** The overlay must **not** steal pointer events. Set `pointer-events: none` on the grid canvas so `mousedown` / `mousemove` reach the artwork surface (or a single parent handler reading coordinates from the shared viewport math).

#### Implementation Sketch

- **State:** `showPixelGrid: boolean` (and optionally grid color/contrast) lives in editor UI state (e.g. `useEditorStore` alongside zoom/pan), **not** persisted in `Artwork` unless product requirements ask for per-document defaults.
- **Rendering:** `renderPixelGrid(ctx, artwork.width, artwork.height, viewport)` in `gridRender.ts` clears the overlay, applies the **identical** transform as `renderCanvas`, then strokes vertical/horizontal lines on integer boundaries. When `showPixelGrid` is false, skip drawing or hide the layer.
- **Performance:** At $1000 \times 1000$, naive full grids imply thousands of segments. **Viewport culling**—draw only lines whose world-coordinate positions intersect the visible screen rectangle after inverse viewport mapping—keeps pan/zoom smooth.

```typescript
// features/editor/logic/gridRender.ts (conceptual)

export function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  worldHeight: number,
  viewport: ViewportState,
  options: { color?: string; lineWidth?: number }
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(viewport.viewOffset.x, viewport.viewOffset.y);
  ctx.scale(viewport.scale, viewport.scale);
  ctx.strokeStyle = options.color ?? "rgba(0,0,0,0.25)";
  ctx.lineWidth = options.lineWidth ?? 1 / viewport.scale; // ~1 screen px in world units
  // Draw vertical/horizontal lines for x in [0..worldWidth], y in [0..worldHeight]
  // with visible-range culling for performance.
  ctx.restore();
}
```

*(Exact stroke width in world units should be tuned so lines read as ~1 CSS pixel on screen across zoom levels.)*

---

## 4. Key Functional Feature Modules

### A. Non-Destructive Event Mechanism (Mouse State Painting)

To check if the user is dragging across the canvas while holding down their click:

1. Listen to `onMouseDown` on the canvas container element. Identify the specific active click button (`event.buttons === 1` for Left-Click, `event.buttons === 2` for Right-Click).
2. Attach an `onMouseMove` window tracker event listener. Find the mouse grid location through `screenToWorldCoordinates`.
3. If the grid coordinates sit inside valid array parameters $(0 \le X < \text{width})$ and $(0 \le Y < \text{height})$, update the specific binary location:

   $$\text{Index} = X + (Y \cdot \text{Width})$$

4. Fire `requestAnimationFrame` updates to execute re-renders efficiently without bottlenecking runtime execution threads.

### B. High-Performance History Architecture (Undo/Redo Command System)

Instead of keeping a snapshot stack of the full 1MB `Uint8Array` buffer for every incremental stroke action, the app tracks atomic State Deltas.

```typescript
// features/editor/types/editor.type.ts

export interface IPixelDelta {
  index: number;
  previousPaletteIndex: number;
  newPaletteIndex: number;
}

export interface IHistoryCommand {
  deltas: IPixelDelta[]; // Grouped modifications made in one single stroke event
}
```

- **Undo execution:** Pop an `IHistoryCommand` from the Undo collection stack, iterate backward over its array parameters, and apply the `previousPaletteIndex` values back into the underlying `pixelData` buffer.
- **Redo execution:** Pop an `IHistoryCommand` from the Redo collection stack, iterate forward, and apply `newPaletteIndex`.

### C. Canvas Re-Dimension Logic (Resizing Core Engine)

When changing document grid scopes (e.g., changing from $100 \times 100$ to $200 \times 200$), memory buffers mapping existing artwork arrays must reconstruct dynamically.

```typescript
// features/editor/logic/pixelBuffer.ts

export function resizePixelBuffer(
  oldBuffer: Uint8Array,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  backgroundPaletteIndex: number
): Uint8Array {
  const newBuffer = new Uint8Array(newW * newH);
  newBuffer.fill(backgroundPaletteIndex);

  const minW = Math.min(oldW, newW);
  const minH = Math.min(oldH, newH);

  for (let y = 0; y < minH; y++) {
    for (let x = 0; x < minW; x++) {
      const oldIdx = x + y * oldW;
      const newIdx = x + y * newW;
      newBuffer[newIdx] = oldBuffer[oldIdx];
    }
  }

  return newBuffer;
}
```

---

## 5. UI Layer Guidelines (Tailwind CSS Integration)

The interface relies completely on pure utility classes via Tailwind CSS, without reliance on secondary heavyweight UI component libraries. Colors are semantic tokens declared once in `src/app/globals.css` (`@theme`); Tailwind's default palette is removed, and canvas renderers read the same CSS variables (`--color-grid-line`, `--color-guide-*`).

### Checkerboard Background

Do not simulate transparency using individual canvas pixels. Utilize native modern web styling via custom container backgrounds behind the artwork canvas (this pattern is **not** the editable pixel grid; see **Pixel Grid Overlay** in Section 3):

```css
.pixel-checkerboard {
  background-color: var(--color-checker-light);
  background-image: linear-gradient(45deg, var(--color-checker-dark) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-checker-dark) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-checker-dark) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-checker-dark) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
}
```

### Canvas Element Sizing

Canvas rendering outputs should bind directly to internal element width/height definitions (`<canvas width={1000} height={1000} />`) instead of matching flex layouts directly through arbitrary percentage targets. Wrap inside a scrolling viewport wrapper: `.overflow-hidden .w-full .h-full .relative`.

---

## 6. Implementation Checklist

- [ ] Create database core configuration hook inside `src/features/shared/db/dexie.config.ts`.
- [ ] Write array buffer serialization functions mapping binary buffers inside `src/features/shared/utils/binaryHelpers.ts`.
- [ ] Implement Viewport Matrix tracker hooks (`useZoomPan.ts`) managing translation offsets.
- [ ] Build standard Left-Click draw / Right-Click paint action logic into canvas triggers.
- [ ] Connect History Command state registers managing execution arrays for Undo/Redo operations.
- [ ] Set up layout cards inside `/gallery` managing file actions (Rename, Clone, Delete).
- [ ] Add stacked **pixel grid overlay** canvas (`PixelGridOverlay.tsx` + `gridRender.ts`) sharing `ViewportState` and backing-store size with the artwork canvas; `pointer-events: none` on the overlay.
- [ ] Expose **show/hide pixel grid** from editor UI state (toolbar toggle / shortcut); omit grid pass when hidden.
- [ ] Add viewport culling (or equivalent optimization) for grid line rendering on large documents.
