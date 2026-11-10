# AGENTS.md

Guide for AI coding agents (and humans) working in this repo. Read it before changing anything.

## What this is

PixelHB: a browser pixel-art editor built with Next.js. Artworks live in IndexedDB (Dexie) as indexed-palette `Uint8Array` layers up to 1000 × 1000; the editor draws them on stacked `<canvas>` layers. Architecture and data model: `TDD.md`.

## Repo map

```
src/app               Next.js routes; thin, they render a feature screen
src/features/shared   shared kernel: UI primitives, db, artwork model, utils
src/features/editor   canvas editor: components, hooks, pure logic, services
src/features/gallery  gallery: components, hooks, services, store
src/content           all UI copy, typed
```

Dependencies flow one way: **shared → editor / gallery → app**.

## Rules

- **Boundary:** `src/features/shared` may not import `src/features/editor`, `src/features/gallery` or `src/app`; `editor` and `gallery` may not import each other or `src/app`. What both features need moves to `shared`. ESLint enforces it and CI fails on a violation. Do not disable the rule; move the code instead.
- **No third-party UI kit.** Build components in `src/features/shared/components` (primitives) or the feature's `components/`. Behavior-only libraries (`@dnd-kit`, `dexie`, `zustand`) are fine.
- **Every `.tsx` component is presentation only.** It renders props and what its hook returns: no logic, no data, no class strings. Derived values, formatting and behavior (state, effects, browser APIs, observers, timers, canvas drawing) live in a `useX.ts` hook next to the component, built on pure `.ts` modules (`features/*/logic`); static data it renders lives in `X.data.ts` or `src/content`; classes live in `X.style.ts`, composed with `cx()` (`src/features/shared/utils/cx.ts`). ESLint fails the build on helper functions, arithmetic, template formatting, array manipulation, module-level data, effects or browser APIs in a component file (`presentation/no-restricted-syntax`). Full rule and examples: "Component architecture" below. Applies to shared primitives, feature components and `src/app` route files alike.
- **Types live in `X.type.ts`.** Every `interface` and `type` goes in a `.type.ts` file next to the file that uses it (`Button.tsx` → `Button.type.ts`; site copy → `src/content/content.type.ts`); tests may keep local types. Interfaces start with `I` (`IArtwork`), type aliases with `T` (`TButtonProps`). ESLint enforces both.
- **Token-only styling.** Colors, fonts and radii are semantic tokens declared once in `src/app/globals.css` (`@theme`). Style files use the Tailwind utilities those tokens generate (`bg-surface`, `text-muted`, `outline-focus`…). Tailwind's default palette is removed, so raw colors can't be used; canvas renderers read colors from the same CSS variables, never hex literals.
- **Accessibility is a requirement:** semantic HTML, an accessible name on every control (icon buttons included), visible focus (`focus-visible`), WCAG 2.2 AA contrast for every token pair (tested), keyboard access to every tool, and `prefers-reduced-motion` honored (opacity fades only).
- **No scroll-jacking:** never `preventDefault` wheel, touch or keyboard scrolling of the page. The only exception is the canvas viewport, which owns wheel, pinch and drag for zoom and pan while the pointer is over it; keyboard shortcuts never swallow keys while focus is in a text field.
- **Copy:** all text lives in `src/content` (labels, titles, toasts, `aria-label`s, metadata).

## Component architecture

Each concern has its own kind of file. A component file never mixes them.

- **`X.tsx` is presentation only.** It maps props and hook results to markup: JSX, destructuring, `.map` over ready-made arrays, simple conditionals on given values (`tool === "fill"`, `index > 0`), and `cx()` for classes. Nothing else: no helper functions, arithmetic, template formatting, array manipulation (`filter`, `sort`, `join`…), module-level data, effects, timers, observers or `window` / `document` / `navigator`.
- **`useX.ts` is behavior and derived data.** State, effects, browser APIs, timers, canvas drawing, and the view model the markup needs. It never returns JSX. A generic behavior hook is named after what it does (`useZoomPan`) and composed by the component's own hook.
- **Pure logic** that needs no React (`coordinateMath`, `pixelBuffer`, `viewportZoomMath`) goes in a plain `.ts` module with its own unit test; hooks call it.
- **`X.data.ts`** holds static data a component renders (tool lists, presets). UI copy lives in `src/content`.
- **`X.type.ts`** holds every type and interface, next to the file that uses it.

## Styling architecture

Markup and styling never share a file.

- **`X.style.ts` owns every class.** It exports one plain object per component: `base` for the classes every instance gets, one key per variant mapping each option to its classes, and named keys for other parts. No logic: values are plain strings, or `cx()` over strings and shared pieces (`focusRing`). `.join()` and template literals fail ESLint, so Tailwind always sees every class literally.
- **`X.tsx` composes classes with `cx()`:** `cx(button.base, button.variant[variant], className)`. A class string in `className` (literal, template, or inside a call/conditional) fails ESLint.
- **Variants are declared once.** Prop types come from the style object (`variant?: keyof typeof button.variant`). Defaults live in the component's props.
- **Callers extend, never override.** A component accepts `className` and passes it last to `cx()`; use it for layout, not to restyle internals.

## Commands

| Command                               | What it does                                                     |
| ------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                         | Next.js dev server                                               |
| `npm run build`                       | production build                                                 |
| `npm run lint`                        | ESLint (boundary, component, style-file and type rules)          |
| `npm run typecheck`                   | route types + `tsc --noEmit`                                     |
| `npm test`                            | Vitest                                                           |
| `npm run format`                      | Prettier; also sorts Tailwind classes, inside `cx()` too         |
| `npm run design:detect -- <src\|url>` | Impeccable's deterministic design detector (see "Design review") |

## Design review

Two project-scoped agent skills live in `.claude/skills/` (pinned in `skills-lock.json` and the skill's `scripts/VERSION`):

- **`impeccable`** (`/impeccable <command>`): design direction and review. Product truth lives in `PRODUCT.md`, the visual system in `DESIGN.md`; read both before any UI change. `.claude/settings.json` runs its detector hook after UI edits. Refresh with `npx impeccable update`.
- **`web-design-guidelines`** (`/web-design-guidelines <files>`): Vercel's Web Interface Guidelines checklist (focus, forms, hit targets, states). Refresh with `npx skills update`.

Their critiques are model judgment: useful, but they can miss real problems and flag non-problems. Order of trust when reviewing or changing UI:

1. **Deterministic checks decide.** `npm test` (token contrast), `npm run lint` (jsx-a11y, architecture rules) and `npm run design:detect -- src` plus a scan of the running page (`npm run design:detect -- http://localhost:<port>/gallery`, again with `--viewport 390x844`). File scans skip element rules such as contrast and tiny text; only the URL scan runs them.
2. **Judgment findings need evidence.** A finding from `/impeccable critique|audit` or `/web-design-guidelines` cites a file and line or selector and a screenshot of the rendered page at the size it ships, and says what to change. Without that it is a suggestion, not a defect.
3. **Hugo decides judgment calls.** Fix deterministic failures directly; list judgment findings in the PR for review instead of applying taste changes unasked. `PRODUCT.md`, `DESIGN.md` and the rules above win over generic skill advice.

## Workflow

Never commit to `main`. Each stage of work gets its own branch (`feat/<name>`, `fix/<name>`, `refactor/<name>`), stays small (≤ ~20 files) and lands through a pull request that Hugo reviews and merges; CI must be green. Write the failing test first for anything with logic; run lint, typecheck, test and build before asking for review.

**Verifying a production build while Hugo works:** never delete or build into `.next` (his `next dev` and builds use it). Build and serve in isolation: `NEXT_DIST_DIR=.next-verify npm run build`, then `NEXT_DIST_DIR=.next-verify npm start -- -p <port>` once the build has finished.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
