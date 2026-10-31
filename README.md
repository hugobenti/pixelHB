<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/pixelhb-banner-dark.svg">
    <img src="docs/brand/pixelhb-banner-light.svg" alt="PixelHB" width="400" height="56">
  </picture>
</h1>

PixelHB is a local-first pixel-art editor that runs in the browser. You don't need an account or an install: open it, draw, export. Artworks are saved in the browser's IndexedDB (via Dexie), so your work survives a reload. Signing in with Google is optional and keeps them in a PixelHB folder in your own Google Drive. Your art is always yours: PixelHB keeps no copies. Canvases go up to 1000 × 1000 pixels, each with an indexed palette of up to 256 colors and any number of layers. It works on desktop (mouse, trackpad, keyboard) and on phones (touch, pinch).

## Features

### Gallery (`/gallery`)

- Lists every artwork stored in this browser, with a thumbnail of each one (drawn without the pixel grid). When signed in, drawings that exist only in Drive appear as previews until they are downloaded.
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
- **Download PNG** at ×1, ×4, ×8, ×16 or ×32 with sharp pixel upscaling (long edge capped at 4096 px). It defaults to ×1 with no credit strip, for game assets, and remembers your size and strip choices; sizes that would exceed the cap are disabled. An optional "Made with PixelHB" strip (logo and link) goes below the art for exports at least 256 px wide (the strip counts toward the 4096 px cap). **Share image** always sends the larger image (the smallest scale that reaches 1024 px) with the PixelHB strip, through the device's share sheet when it can share files, otherwise copies it to the clipboard, otherwise downloads it; that image is rendered ahead of time while the panel is open.
- Gallery Share: each card's ⋯ menu has a **Share image** item that shares the artwork the same way, at the default size (smallest scale reaching 1024 px) and always with the "Made with PixelHB" strip; Download PNG in the editor offers other sizes and no strip. Artworks still only in Drive have no Share item.
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

### Google Drive sync (optional)

- Sign in with Google from the header (or the phone menu) to save artworks to a `PixelHB` folder in your own Drive and see them on every device where you sign in.
- Sync runs in the background: about ten seconds after the last edit, when you leave the tab, when the browser is back online and when the gallery opens. Offline, drawing keeps working.
- Deleting an artwork moves its Drive copy to the Drive trash, and it disappears from your other devices too. Trashing the file in Drive removes it from PixelHB the same way; restoring it from the Drive trash brings it back.
- Signing out removes that account's artworks from this browser (they stay in Drive), after offering to download changes that haven't reached Drive yet.

## Keyboard shortcuts

| Keys                           | Action                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `Ctrl+Z` / `Cmd+Z`             | Undo                                                                                                                        |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo                                                                                                                        |
| `G`                            | Toggle the pixel grid                                                                                                       |
| `Space` (hold) + drag          | Pan the canvas (while the pointer is over the canvas or it has focus)                                                       |
| `Alt` / `Option` (hold) + drag | Pick a color from the canvas; release over a color to use it                                                                |
| Arrow keys                     | Pan the canvas while it has focus (32 px per step)                                                                          |
| `Shift` + arrow keys           | Pan in larger steps (128 px)                                                                                                |
| `Esc`                          | Close the layers drawer, the settings drawer or the shift-pixels controls; cancel a color pick or turn off the color picker |

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

### Google sign-in

The app works fully without an account; signing in with Google (Auth.js v5, with the `drive.file` scope and offline access) adds Drive sync. Sign-in is always on, so every environment that should offer it needs the variables below. Without them the app still builds and runs signed out; **Sign in with Google** ends on the home page when `AUTH_SECRET` is missing, or on Google's error page when only `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is missing. A production server logs the missing variables by name at its first auth request. Copy `.env.example` to `.env.local` and fill in (leave the two commented lines commented unless you need them: a blank `AUTH_TRUST_HOST=` or `AUTH_REDIRECT_PROXY_URL=` is read as an empty value and breaks Auth.js):

| Variable                               | Purpose                                                                                                                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                          | `npx auth secret` or `openssl rand -base64 33`; same value in Production and Preview                                                                                                                                   |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | The Google OAuth client: the **Dev** client in `.env.local`, the **production** client only in Vercel (see below)                                                                                                      |
| `AUTH_REDIRECT_PROXY_URL`              | `https://pixelhb.vercel.app/api/auth` in **both** Production and Preview, so previews sign in through production. Auth.js appends `/callback/google`, so the production client needs only the production redirect URI. |
| `AUTH_TRUST_HOST`                      | `true`, only for a local `npm start`. Vercel and `next dev` already trust the host.                                                                                                                                    |

Tokens stay in the encrypted `HttpOnly` session cookie and never reach client JavaScript; the session the browser sees holds only the user's id, name, email and image. Browsers without the Web Locks API (which sync needs) show no account control and stay local-only.

**Two OAuth clients.** Local development uses a separate **Dev** OAuth client (Google Auth Platform → Clients, type Web application) whose only authorized redirect URI is `http://localhost:3000/api/auth/callback/google`; its id and secret go in `.env.local`. The **production** client lists only `https://pixelhb.vercel.app/api/auth/callback/google` (no localhost URIs) and its secret lives only in Vercel, never on a dev machine. Deploying: see [Production setup](#production-setup).

## Scripts

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | Next.js dev server                                                |
| `npm run lint`       | ESLint (feature boundaries, component, style-file and type rules) |
| `npm run typecheck`  | `next typegen` then `tsc --noEmit`                                |
| `npm test`           | Vitest, single run                                                |
| `npm run test:watch` | Vitest in watch mode                                              |
| `npm run build`      | Production build                                                  |
| `npm start`          | Serve the production build                                        |
| `npm run format`     | Prettier, which also sorts Tailwind classes                       |

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

The art belongs to the artist. PixelHB stores no artwork.

- **Signed out:** artworks live only in the browser's IndexedDB. Nothing is sent to the artwork API. Clearing site data or switching browsers or devices loses them, so use **Export JSON** from the editor settings to keep a backup. You can re-import that file from the gallery.
- **Signed in with Google (optional):** IndexedDB stays as the local working copy, and artworks are also saved to a `PixelHB` folder in the user's own Google Drive, using the `drive.file` scope (PixelHB can only see files it created). The route handlers in `src/app/api/gallery` are stateless proxies: artwork passes through them on its way to and from Drive and is never stored or logged. Tokens live in an encrypted Auth.js cookie. PixelHB has no database. Deletions propagate both ways: deleting in PixelHB trashes the Drive file, and a file trashed in Drive is removed from every signed-in device at its next sync (kept in a local "removed" table for 30 days); restoring it from the Drive trash brings it back.
- **Analytics:** Vercel Web Analytics counts page visits (no cookies). PostHog product analytics (events, heatmaps, session replay) runs only after the visitor accepts the consent banner, and can be withdrawn on `/privacy`. Code: `src/features/shared/analytics/`. It sends no artwork: replay blocks every `<canvas>` and `data:`/`blob:` image, never records canvas frames, masks inputs and the document title (which holds the artwork name); events carry no names, pixels, palettes or error text; nobody is identified. Traffic goes through `/ingest` (`src/app/ingest/[...path]/route.ts`), which forwards to PostHog EU Cloud without cookies or credentials.

The user-facing explanation is the [`/privacy`](src/content/privacy.ts) page.

## Production setup

Sign-in and Drive sync are always on; there is no feature flag.

1. **Google Auth Platform:** the app is published ("In production") with brand verification approved. The **production** OAuth client lists only `https://pixelhb.vercel.app/api/auth/callback/google`; `http://localhost:3000/api/auth/callback/google` belongs on the separate **Dev** client (see [Google sign-in](#google-sign-in)).
2. **Vercel → Settings → Environment Variables**, for **Production and Preview**: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (the production client) and `AUTH_REDIRECT_PROXY_URL=https://pixelhb.vercel.app/api/auth`, so previews sign in through production. `AUTH_URL` is not needed. The build needs none of them (CI builds without).
3. **Vercel → Settings → Deployment Protection:** protect Preview deployments (Vercel Authentication), since previews hold `AUTH_SECRET` and the production Google secret.
4. Optional: a **Vercel Firewall** rate-limit rule on `/api/gallery/*` (per IP), so one client cannot burn the project's Drive quota.
5. Optional, **PostHog analytics:** set `NEXT_PUBLIC_POSTHOG_KEY` (the PostHog **EU Cloud** project token, `phc_…`; public) for **Production and Preview**. It is read at build time, so redeploy after changing it; unset or empty turns analytics off entirely (no banner, no PostHog script, every capture a no-op). In the PostHog project settings, turn on **Discard client IP data** (the IP is only used for the country lookup) and leave canvas recording off. Each request under `/ingest` is one Vercel function invocation; the Hobby plan has enough headroom for this traffic.

**After each deploy that touches auth or sync, check production:**

- Sign in, open `/api/auth/session` and note `user.id`; sign out, sign in again: same id.
- Draw, and see the file appear in `PixelHB/` in Drive (a `403` on `POST /api/gallery/<id>` means the request origin check disagrees with the host).
- Sign in on a second browser: the drawing is there; edit it there and see the change come back.
- Open an artwork, go offline (DevTools → Network), switch tabs and come back: the editor stays open; back online, the change syncs.
- Delete an artwork in one browser: it disappears from the other after its next sync. Trash one artwork file in Drive: it disappears too; restore it from the Drive trash: it comes back.
- Go offline, draw, then sign out: the dialog offers Download, Sign out anyway and Cancel; Cancel keeps everything.
- Remove PixelHB from the Google account's third-party connections: the next sync asks to sign in again (gallery note, account panel); nothing is deleted on the device or in Drive.

**Recovery:** to stop sign-in in an emergency, remove the `AUTH_*` variables in Vercel and redeploy. The app keeps working signed out; **Sign in with Google** ends on the home page when `AUTH_SECRET` is missing, or on Google's error page when only `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is missing. Nothing is deleted: drawings of signed-in users stay in IndexedDB under their account id (for up to 7 days after a visit the app keeps showing them on that browser with a "can't confirm your account" note) and reappear, and sync, once the variables are back and the same Google account signs in. Drawings made meanwhile without an account are added to the account that signs in next.

## CI and deployment

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request and on pushes to `main`. It installs dependencies with `npm ci` on the Node version from `.nvmrc`, then runs `lint`, `typecheck`, `test` and `build`.

The app is deployed on Vercel, and each pull request gets a preview deployment.
