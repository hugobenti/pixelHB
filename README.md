<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/pixelhb-banner-dark.svg">
    <img src="docs/brand/pixelhb-banner-light.svg" alt="PixelHB" width="400" height="56">
  </picture>
</h1>

PixelHB is a local-first pixel-art editor that runs in the browser. You don't need an account or an install: open it, draw, export. Artworks are stored in the browser's IndexedDB (via Dexie), so your work survives a reload and nothing leaves the browser. Canvases go up to 1000 × 1000 pixels, each with an indexed palette of up to 256 colors and any number of layers. It works on desktop (mouse, trackpad, keyboard) and on phones (touch, pinch).

## Features

### Gallery (`/gallery`)

- Lists every artwork stored in this browser, with a thumbnail of each one (drawn without the pixel grid).
- Create a new artwork by setting its title, background color and size. There are square presets (16, 32, 64, 128) or you can enter any width and height up to 1000 px.
- Rename, clone and delete artworks. Delete asks for confirmation first.
- Import an artwork from a JSON file.
- Switch between the Light and Dark themes. On a first visit the app follows the OS setting. Once you pick a theme, the choice is saved.

### Editor (`/editor/[id]`)

- Paint with a primary and a secondary color slot. The main button (or touch) paints with the active slot, and on desktop the right mouse button paints with the other one.
- Paint bucket mode, plus pan mode (or hold Space and drag).
- Color picker: press and drag on the canvas to pick a palette color from what you see, with a loupe that compares it with your current color; release to paint with it. Toolbar button, or hold Alt (Option on a Mac).
- Zoom with the toolbar buttons, the mouse wheel or a pinch gesture. Pan by dragging, or with the arrow keys while the canvas is focused.
- Undo and redo.
- Toggle the pixel grid.
- Shift pixels: moves the active layer one pixel up, down, left or right. Pixels that leave one edge wrap around to the opposite edge.
- Reference image: load an image file and show it as an overlay on the canvas, toggled from settings.
- Canvas size: resizes the canvas with pixels anchored to the top-left. Shrinking asks for confirmation because it crops every layer and clears the undo history.
- Image detail: counts the composited pixels per palette color in the visible area.
- Changes are saved to IndexedDB automatically.
- Theme toggle in the settings drawer.

### Layers

- Add, rename, duplicate, show or hide, and delete layers.
- Reorder layers by dragging them (built on dnd-kit). On touch, hold briefly and then drag.
- Deleting a layer asks for confirmation, and the last remaining layer can't be deleted.
- Painting on a hidden active layer is blocked, and a notice says why.

### Palette

- New artworks start with the Sweetie 16 palette (16 colors). If the chosen background color isn't in the palette, it is added.
- Edit any swatch, add colors (up to 256) and remove colors. Removing a color that pixels use asks what they become (another palette color or transparent). Removing a color can be undone.

### Files

- Export the current artwork as a PNG snapshot.
- Export the full editable document as JSON, and import it again from the gallery.

## Keyboard shortcuts

| Keys                                | Action                                              |
| ----------------------------------- | --------------------------------------------------- |
| `Ctrl+Z` / `Cmd+Z`                  | Undo                                                |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z`      | Redo                                                |
| `G`                                 | Toggle the pixel grid                               |
| `Space` (hold) + drag               | Pan the canvas (while the pointer is over the canvas or it has focus) |
| `Alt` / `Option` (hold) + drag      | Pick a color from the canvas; release over a color to use it |
| Arrow keys                          | Pan the canvas while it has focus (32 px per step)  |
| `Shift` + arrow keys                | Pan in larger steps (128 px)                        |
| `Esc`                               | Close the layers drawer, the settings drawer or the shift-pixels controls; cancel a color pick or turn off the color picker |

Shortcuts are ignored while focus is in a text field.

## Tech stack

| Area      | Library                                                         |
| --------- | --------------------------------------------------------------- |
| Framework | [Next.js](https://nextjs.org) 16.4.3 (App Router), React 19.3.1 |
| Language  | TypeScript 6                                                    |
| Styling   | Tailwind CSS v4 (semantic tokens in `src/app/globals.css`)      |
| State     | Zustand 5                                                       |
| Storage   | Dexie 4 (IndexedDB)                                             |
| Drag/drop | dnd-kit (`@dnd-kit/core` 6, `@dnd-kit/sortable` 10)             |
| Tests     | Vitest 5                                                        |
| Tooling   | ESLint 9, Prettier 3 with `prettier-plugin-tailwindcss`         |

The project uses no third-party UI kit. All components are built in the repo.

## Getting started

Requires Node.js 22 (see [`.nvmrc`](.nvmrc)).

```bash
nvm use        # optional, picks up .nvmrc
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The root URL takes you to the gallery.

## Scripts

| Command              | What it does                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `npm run dev`        | Next.js dev server                                                   |
| `npm run lint`       | ESLint (feature boundaries, component, style-file and type rules)    |
| `npm run typecheck`  | `next typegen` then `tsc --noEmit`                                   |
| `npm test`           | Vitest, single run                                                   |
| `npm run test:watch` | Vitest in watch mode                                                 |
| `npm run build`      | Production build                                                     |
| `npm start`          | Serve the production build                                           |
| `npm run format`     | Prettier, which also sorts Tailwind classes                          |

To build without touching the `.next` directory used by a running dev server, run the build in isolation:

```bash
NEXT_DIST_DIR=.next-verify npm run build
NEXT_DIST_DIR=.next-verify npm start -- -p <port>
```

## Project structure

```
src/app               Next.js routes (/, /gallery, /editor/[id]); thin, each renders a feature screen
src/content           all UI copy (labels, toasts, aria-labels, metadata), typed
src/features/gallery  gallery screen: artwork cards, create dialog, JSON import, Zustand store
src/features/editor   canvas editor: components, hooks, pure logic (with unit tests), services
src/features/shared   shared kernel: UI primitives, Dexie db, artwork model and file I/O, theme, utils
public/icons          SVG icons used as masks by the UI
```

Dependencies flow one way: `shared` → `editor` / `gallery` → `app`. ESLint enforces this.

Each component is split by concern:

- `X.tsx` is markup only.
- `useX.ts` holds behavior and derived data.
- `X.style.ts` holds the Tailwind classes, composed with `cx()`.
- `X.type.ts` holds the types.

Pure logic lives in plain `.ts` modules with their own tests. The full rules are in [`AGENTS.md`](AGENTS.md), and the architecture and data model are in [`TDD.md`](TDD.md).

## Design system

- [`DESIGN.md`](DESIGN.md): visual system, including tokens, typography (Schibsted Grotesk and JetBrains Mono), and the light and dark themes.
- [`docs/design/brand.md`](docs/design/brand.md): the PixelHB logo as pixel grids, its palette and usage rules. The logo files in `docs/brand/` and the app icons are generated from the same grids.
- [`PRODUCT.md`](PRODUCT.md): users, purpose and product principles.
- [`docs/design/explorations.md`](docs/design/explorations.md): how the theme was chosen.

Every token pair is checked against WCAG 2.2 AA contrast by `src/app/tokenContrast.test.ts`.

## Data and privacy

All artworks live in your browser's IndexedDB. There is no server, account or upload. Clearing site data or switching browsers or devices loses them, so use **Export JSON** from the editor settings to keep a backup. You can re-import that file from the gallery.

## CI and deployment

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request and on pushes to `main`. It installs dependencies with `npm ci` on the Node version from `.nvmrc`, then runs `lint`, `typecheck`, `test` and `build`.

The app is deployed on Vercel, and each pull request gets a preview deployment.
