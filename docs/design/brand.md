# PixelHB brand

Status: approved direction (Oct 22, 2026). Replaces the working name "PixelCraft".

## Intent

PixelHB is a pixel-art editor signed by its author: **HB** is Hugo Bentivegna's initials and also the grade of the everyday graphite pencil. The identity is a pixel-art pencil with **HB** stamped on it. The pencil link stays visual: product copy never explains it or says "pencil" or "sketchbook". People who notice get the wink; everyone else sees a pencil, which already says "drawing app".

The mood is a sketchbook, not an arcade: calm, handmade, personal. It sits on the app's existing two themes (light "Paper & Ink", dark "Studio Dark"; see [`DESIGN.md`](../../DESIGN.md)) without changing them.

Goals:

- One recognizable mark that works from a 16 px browser tab to a social banner.
- Everything is real pixel art: drawn on a grid, every pixel deliberate.
- The same pixels everywhere: every asset comes from the grids in this document.

Non-goals:

- No change to the app's color tokens, fonts or layout system.
- No mascot or illustration set; no marketing site beyond the home page.

Anti-goals (a failure even if it ships):

- Smoothed, blurred or anti-aliased edges, or scaling by a non-integer factor.
- Copy that spells out the pencil joke.
- Losing users' artworks or settings because of the rename (see [Rename rules](#rename-rules)).

## Name

- Written **PixelHB**: capital P, capital H and B, one word. Never "Pixel HB", "PixelHb" or "Pixelhb" in copy.
- The only place with a space is the stamp on the brand pencil, `PIXEL HB`, which imitates a real pencil's brand name followed by its grade.

## The marks

Pixel grids below are the source of truth. One character is one pixel; `.` is transparent. Colors are in [Palette](#palette).

### Pencil (primary mark)

A hexagonal pencil seen from the side, pointing right: eraser, ridged metal band, three painted faces (light top, mid, dark bottom), **HB** stamped in graphite, wood cone, graphite tip, and one freshly drawn pixel ahead of the tip. 33 × 7 pixels.

```
.eeeemMmyyyyyyyyyyyyyyyyww.......
efffemMmyyyysysyssyyyyyywwww.....
eeeeemMmYYYYsYsYsYsYYYYYwwwwwq...
eeeeemMmYYYYsssYssYYYYYYwwwwwGG.d
eeeeemMmYYYYsYsYsYsYYYYYWWWWWG...
EEEEEMMMoooososossooooooWWWW.....
.EEEEMMMooooooooooooooooWW.......
```

### Wordmark

"PixelHB" in hand-drawn 5 × 7 pixel letters with one empty column between letters. "Pixel" uses ink (`i`), "HB" uses the HB color (`h`). 37 × 7 pixels. Used only in the logo, never as a UI font.

```
iiii...i..............ii..h...h.hhhh.
i...i..................i..h...h.h...h
i...i.ii..i...i..iii...i..h...h.h...h
iiii...i...i.i..i...i..i..hhhhh.hhhh.
i......i....i...iiiii..i..h...h.h...h
i......i...i.i..i......i..h...h.h...h
i.....iii.i...i..iiii.iii.h...h.hhhh.
```

### Brand pencil (banner mark)

The pencil with a longer body stamped `PIXEL HB` in 3 × 5 letters. For the README banner, the social image and other wide spaces. 50 × 7 pixels.

```
.eeeemMmyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyww.......
efffemMmyyssyysssysysysssysyyyyysysyssyyywwww.....
eeeeemMmYYsYsYYsYYsYsYsYYYsYYYYYsYsYsYsYYwwwwwq...
eeeeemMmYYssYYYsYYYsYYssYYsYYYYYsssYssYYYwwwwwGG.d
eeeeemMmYYsYYYYsYYsYsYsYYYsYYYYYsYsYsYsYYWWWWWG...
EEEEEMMMoosooosssosososssosssooososossoooWWWW.....
.EEEEMMMoooooooooooooooooooooooooooooooooWW.......
```

### Square icon: pencil end

The pencil seen from its tip: amber hexagon (lit from the top left), wood ring, graphite core. The core is literally a pixel. 16 × 16 pixels, transparent background. Used wherever a square is required: favicon, app icons, avatars.

```
................
.....yyyyYY.....
....yyyyyYYY....
...yyywwwwYYY...
..yyywwwwwwYYY..
.yyywwwwwwwwYYY.
.YYwwwqqGGwwwYY.
.YYwwwqGGGwwwYY.
.YYwwwGGGGWWWYY.
.YYwwwGGGGWWWYY.
.ooowwwWWWWWooo.
..ooowwWWWWooo..
...ooowWWWooo...
....oooooooo....
.....oooooo.....
................
```

## Lockups

| Lockup          | Build                                                                   | Use                                    |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| Horizontal      | Pencil, a gap of 4 pixels, wordmark; both 7 pixels tall and top-aligned | App header, anywhere wide and short    |
| Stacked         | Pencil centered above the wordmark, 3 pixels apart                      | Square-ish spaces                      |
| Brand pencil    | The banner mark alone                                                   | README banner, social image            |
| Pencil alone    | The primary mark alone                                                  | Small wide spaces                      |
| Square icon     | Pencil end alone                                                        | Favicon, app icons, anything square    |
| Square wordmark | "Pixel" centered above "HB" drawn 2× larger, 2 pixels apart             | Square spaces that must name the brand |

"Pixels" in lockup measurements are logo pixels, so they scale with the logo.

## Palette

The pencil's own colors are the brand palette. **Pencil amber** is the brand color.

| Key | Name           | Hex       | Role                         |
| --- | -------------- | --------- | ---------------------------- |
| `y` | Amber light    | `#F6C66E` | top face                     |
| `Y` | Pencil amber   | `#EDA743` | middle face; the brand color |
| `o` | Amber shade    | `#C27A1E` | bottom face                  |
| `w` | Wood           | `#F2D3A6` | cone                         |
| `W` | Wood shade     | `#D6AA78` | cone, lower half             |
| `G` | Graphite       | `#2A2C38` | tip, pencil-end core         |
| `q` | Graphite shine | `#8A8D9C` | tip and core highlight       |
| `s` | Stamp          | `#1A1C24` | HB / PIXEL HB stamp          |
| `m` | Ferrule        | `#D9D4C8` | metal band                   |
| `M` | Ferrule ridge  | `#8E897E` | band ridges and lower edge   |
| `e` | Eraser         | `#E5868A` | eraser                       |
| `f` | Eraser shine   | `#F2A7A9` | eraser highlight             |
| `E` | Eraser shade   | `#B13E53` | eraser, lower edge           |

Theme-dependent keys (they follow the light or dark theme):

| Key | Light theme | Dark theme | Role                                                                                   |
| --- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `d` | `#1A1C24`   | `#EFEBE5`  | the drawn pixel ahead of the tip (the theme's `fg`)                                    |
| `i` | `#1A1C24`   | `#EFEBE5`  | "Pixel" in the wordmark (the theme's `fg`)                                             |
| `h` | `#B4500F`   | `#EDA743`  | "HB" in the wordmark: burnt amber on paper (contrast), pencil amber on the dark studio |

The pencil's colors are fixed in both themes; only the drawn pixel and the wordmark switch. Backgrounds behind the logo are the app's own: Paper `#ECE9E1` / surface `#FCFBF7` (light), Studio `#141312` / surface `#1C1B19` (dark).

### One-color version

For print, stamps, embroidery or monochrome UI. The pencil keeps its 33 × 7 outline; every pixel takes one color (`x`), the stamp is knocked out, and the first column of the metal band, the body and the cone becomes transparent so the parts still read. The tip and the drawn pixel stay. Ink `#1A1C24` on light backgrounds, `#FCFBF7` on dark ones, ink on amber.

```
.xxxx.xx.xxxxxxxxxxxxxxx.x.......
xxxxx.xx.xxx.x.x..xxxxxx.xxx.....
xxxxx.xx.xxx.x.x.x.xxxxx.xxxxx...
xxxxx.xx.xxx...x..xxxxxx.xxxxxx.x
xxxxx.xx.xxx.x.x.x.xxxxx.xxxxx...
xxxxx.xx.xxx.x.x..xxxxxx.xxx.....
.xxxx.xx.xxxxxxxxxxxxxxx.x.......
```

## Type

- Logo: the pixel wordmark above. Nothing else is set in pixel letters.
- Product: unchanged. Schibsted Grotesk for interface text, JetBrains Mono for numbers and values (`DESIGN.md`, Typography).

## Usage

- **Scale:** whole-number factors of CSS pixels only, with nearest-neighbor rendering (`shape-rendering="crispEdges"` for SVG, `image-rendering: pixelated` for raster). Never stretch or skew. Browser zoom and fractional device-pixel ratios are accepted as they are; the logo is not re-snapped at runtime.
- **Clear space:** one eraser width (5 logo pixels) on every side.
- **Minimum size:** 1 CSS pixel per logo pixel: pencil 33 px wide, horizontal lockup 74 px wide (33 + 4 + 37). Smaller than that, use the square icon. The app header uses 2× or larger.
- **Backgrounds:** the app's paper, surface or studio colors, or pencil amber for the one-color version. No photos, patterns or busy backgrounds.
- **Don't:** smooth or blur the pixels, recolor the pencil body, add outlines, shadows or gradients, rotate the pencil, or redraw the letters in another font.

## Assets the app ships

| File                                       | Content                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `favicon.ico`                              | Square icon at 16, 32 and 48 px, transparent                                                                                             |
| PNG icons 16, 32, 48                       | Square icon, transparent, for `<link rel="icon">`                                                                                        |
| Apple touch icon, 180 × 180                | Square icon at 7× (112 px) centered on surface `#FCFBF7`, no transparency                                                                |
| PWA icons 192 and 512, plus a maskable 512 | Same tile; the maskable keeps the hexagon inside the central 80% safe zone                                                               |
| Web app manifest                           | name `PixelHB`, short name `PixelHB`, theme and background colors from the light tokens                                                  |
| Open Graph / social image, 1200 × 630      | Brand pencil centered on paper `#ECE9E1` with a faint pixel grid, and below it **Pixel-art editor for the browser** in Schibsted Grotesk |
| OAuth consent-screen logo, 120 × 120       | Square wordmark at 4× ("HB" at 8×) centered on surface `#FCFBF7`, no transparency: `public/brand/pixelhb-logo-120.png`                   |
| Logo SVGs                                  | Horizontal lockup (light and dark) and brand pencil, for the README and docs                                                             |

## In the product

- Browser tab, bookmarks, home screen and installs: the square icon.
- Page title: `PixelHB`; editor pages `{artwork title} · PixelHB` (as today, with the new name). Meta description: "Pixel-art editor for the browser".
- Gallery header: the shared site header carries the logo (the horizontal lockup, a link to `/`, accessible name "PixelHB"); the gallery page's `<h1>` is "Your artworks".
- Editor: no logo. Its top bar stays a tool surface; the "Gallery" back link is unchanged.
- README: brand pencil banner at the top.
- The shared site header and footer (`SiteHeader`, `SiteFooter`) use the same logo component; the footer uses the "pencil alone" mark (`variant="pencil"`).

## Rename rules

The rename touches product-facing text and docs only. Identifiers that live in users' browsers stay as they are, because renaming them would lose artworks or settings:

- IndexedDB database `PixelCraftDB` (and the Dexie class that opens it).
- `localStorage` key `pixelcraft-theme` and the `pixelcraft-themechange` event.
- Anything inside exported JSON files that older files depend on.

Everything else that names the product (site metadata, README, AGENTS.md, DESIGN.md, PRODUCT.md, TDD.md, code comments, `package.json` name) becomes PixelHB / `pixelhb`.

## Rollout

The brand ships ahead of the improvement plan's PR 3, in small PRs:

1. This spec.
2. Brand art and app icons: the grids in code, favicon, PNG and Apple icons, manifest, social image, site name and description.
3. Logo in the gallery header and the README banner (builds on 2).
4. Rename PixelCraft → PixelHB in docs, code comments and the package name, following the rename rules.

## Left to the builder

- How the grids are encoded in code and how the icons and images are generated, as long as every asset comes from these grids (one source) and is pixel-exact.
- Component names and file layout, within the rules in `AGENTS.md`.
- How the theme-dependent colors (`d`, `i`, `h`) reach the UI: as tokens in `src/app/globals.css`. Fixed pencil colors are pixel data, like artwork palettes.
- Logo scale in the gallery header (2× or larger), per breakpoint.
