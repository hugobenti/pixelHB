/**
 * Purpose:
 * Turn a finished drawing into the tool actions an artist would take in the editor (line art with
 * the brush, bucket fills, shading, light, then the final touch) and into a timed sequence to play.
 *
 * Notes:
 * The bucket works like the editor's (usePixelPainting): one click fills every 4-connected pixel of
 * the clicked color at once. A fill is only planned where that click stays inside the drawing and
 * covers no pixel meant to stay transparent; anything else is painted with the brush.
 */
import type {
  ILiveAliveFrame,
  ILiveDrawing,
  ILivePreparedDrawing,
  ILiveStep,
  TLiveAction,
  TLiveStepKind,
} from "./liveCanvas.type";

export const LIVE_EMPTY = 255;

/** Darkest first, so shading lands before light; the kind names the step in the status line. */
const PAINT_ORDER: [number, TLiveStepKind][] = [
  [0, "shadow"],
  [15, "shadow"],
  [8, "shadow"],
  [2, "shadow"],
  [3, "shadow"],
  [14, "color"],
  [4, "color"],
  [7, "color"],
  [9, "color"],
  [10, "color"],
  [13, "light"],
  [6, "light"],
  [5, "light"],
  [1, "light"],
  [12, "light"],
  [11, "light"],
];
/** A smaller enclosed area is quicker to brush than to fill. */
const MIN_FILL = 10;

/**
 * Timing at 60 frames per second: about 8 s of drawing, longer when a drawing has many strokes, so
 * a stroke never paints faster than `minFramesPerPixel` allows.
 */
export const LIVE_TIMING = {
  intro: 30,
  draw: 480,
  bucket: 40,
  /** Frame of a bucket action at which the click lands and the area fills. */
  bucketClick: 24,
  touch: 26,
  minStroke: 10,
  minFramesPerPixel: 0.6,
  pause: 14,
  touchPause: 6,
  rest: 70,
  export: 60,
  hold: 170,
  fade: 50,
};

export function decodeDrawing(rows: string[]): Uint8Array {
  const size = rows.length;
  const pixels = new Uint8Array(size * size).fill(LIVE_EMPTY);
  rows.forEach((row, y) => {
    for (let x = 0; x < size; x += 1) {
      const char = row[x];
      if (char !== ".") pixels[y * size + x] = Number.parseInt(char, 16);
    }
  });
  return pixels;
}

function neighbours4(index: number, size: number): number[] {
  const x = index % size;
  const y = (index - x) / size;
  const out: number[] = [];
  if (x > 0) out.push(index - 1);
  if (x + 1 < size) out.push(index + 1);
  if (y > 0) out.push(index - size);
  if (y + 1 < size) out.push(index + size);
  return out;
}

/** Every pixel 4-connected to `seed` with the seed's current color: what one bucket click fills. */
export function floodRegion(canvas: Uint8Array, size: number, seed: number): number[] {
  const target = canvas[seed];
  const seen = new Uint8Array(canvas.length);
  const region: number[] = [];
  const queue = [seed];
  seen[seed] = 1;
  while (queue.length > 0) {
    const current = queue.pop() as number;
    region.push(current);
    for (const next of neighbours4(current, size)) {
      if (!seen[next] && canvas[next] === target) {
        seen[next] = 1;
        queue.push(next);
      }
    }
  }
  return region;
}

/** Order pixels as one continuous stroke: the next pixel touches the last, or is the nearest one. */
function strokePath(pixels: number[], size: number, start: number): number[] {
  const remaining = new Set(pixels);
  const path: number[] = [];
  let cx = start % size;
  let cy = (start - cx) / size;
  while (remaining.size > 0) {
    let next = -1;
    for (let dx = -1; dx <= 1 && next < 0; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if ((dx || dy) && x >= 0 && y >= 0 && x < size && y < size && remaining.has(y * size + x)) {
          next = y * size + x;
          break;
        }
      }
    }
    if (next < 0) {
      let best = Infinity;
      for (const p of remaining) {
        const px = p % size;
        const py = (p - px) / size;
        const d = (px - cx) ** 2 + (py - cy) ** 2;
        if (d < best) {
          best = d;
          next = p;
        }
      }
    }
    remaining.delete(next);
    path.push(next);
    cx = next % size;
    cy = (next - cx) / size;
  }
  return path;
}

function mostCommon(values: number[]): number {
  const counts = new Map<number, number>();
  let best = values[0];
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    if (count > (counts.get(best) ?? 0)) best = value;
  }
  return best;
}

/** The tool actions that draw `finished`, in order. Replaying them reproduces the drawing exactly. */
export function buildSteps(drawing: ILiveDrawing): ILiveStep[] {
  const size = drawing.rows.length;
  const finished = decodeDrawing(drawing.rows);
  const canvas = new Uint8Array(finished.length).fill(LIVE_EMPTY);
  const touch = new Set(drawing.touch);
  const steps: ILiveStep[] = [];
  let cursor = 2 * size + (size >> 1);

  const brush = (color: number, pixels: number[], kind: TLiveStepKind) => {
    const todo = pixels.filter((p) => canvas[p] !== color);
    if (todo.length === 0) return;
    const path = strokePath(todo, size, cursor);
    for (const p of path) canvas[p] = color;
    cursor = path[path.length - 1];
    steps.push({ tool: "brush", color, kind, pixels: path });
  };

  const paintPass = (
    inScope: (p: number) => boolean,
    fillMayCover: (p: number) => boolean,
    kinds: { outline: TLiveStepKind; fill: TLiveStepKind; rest?: TLiveStepKind },
  ) => {
    const all = Array.from(finished.keys()).filter((p) => finished[p] !== LIVE_EMPTY && inScope(p));
    // Line art: the silhouette plus every dark line inside it, so each area is closed before the
    // bucket is used. A final touch the fill covers (eyes) is part of its area, so it is no edge.
    const lines = all.filter(
      (p) =>
        finished[p] === 0 ||
        isBorder(p, size) ||
        neighbours4(p, size).some(
          (n) => finished[n] === LIVE_EMPTY || (!inScope(n) && !fillMayCover(n)),
        ),
    );
    for (const [color] of PAINT_ORDER) {
      brush(
        color,
        lines.filter((p) => finished[p] === color),
        kinds.outline,
      );
    }
    const tried = new Uint8Array(finished.length);
    for (const start of all) {
      if (tried[start] || canvas[start] !== LIVE_EMPTY) continue;
      const region = floodRegion(canvas, size, start);
      for (const p of region) tried[p] = 1;
      const enclosed = region.every((p) => !isBorder(p, size));
      const allowed = region.every((p) => finished[p] !== LIVE_EMPTY && fillMayCover(p));
      if (!enclosed || !allowed || region.length < MIN_FILL) continue;
      const color = mostCommon(region.filter(inScope).map((p) => finished[p]));
      const seed = closestToCentre(
        region.filter((p) => finished[p] === color),
        size,
      );
      for (const p of region) canvas[p] = color;
      cursor = seed;
      steps.push({ tool: "bucket", color, kind: kinds.fill, pixels: region, seed });
    }
    for (const [color, kind] of PAINT_ORDER) {
      brush(
        color,
        all.filter((p) => finished[p] === color),
        kinds.rest ?? kind,
      );
    }
  };

  if (drawing.touchSeparate) {
    paintPass(
      (p) => !touch.has(p),
      (p) => !touch.has(p),
      { outline: "outline", fill: "fill" },
    );
    paintPass(
      (p) => touch.has(p),
      (p) => touch.has(p),
      {
        outline: "touch",
        fill: "touch",
        rest: "touch",
      },
    );
  } else {
    // The final touch sits inside a filled area (eyes in a face): the fill may cover it first.
    paintPass(
      (p) => !touch.has(p),
      () => true,
      { outline: "outline", fill: "fill" },
    );
    for (const [color] of PAINT_ORDER) {
      brush(
        color,
        drawing.touch.filter((p) => finished[p] === color),
        "touch",
      );
    }
  }
  return steps;
}

function isBorder(index: number, size: number): boolean {
  const x = index % size;
  return x === 0 || x === size - 1 || index < size || index >= size * (size - 1);
}

function closestToCentre(pixels: number[], size: number): number {
  const cx = pixels.reduce((sum, p) => sum + (p % size), 0) / pixels.length;
  const cy = pixels.reduce((sum, p) => sum + Math.floor(p / size), 0) / pixels.length;
  let best = pixels[0];
  let bestDistance = Infinity;
  for (const p of pixels) {
    const d = ((p % size) - cx) ** 2 + (Math.floor(p / size) - cy) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = p;
    }
  }
  return best;
}

/** Paint every step onto an empty canvas. */
export function replaySteps(steps: ILiveStep[], pixelCount: number): Uint8Array {
  const canvas = new Uint8Array(pixelCount).fill(LIVE_EMPTY);
  for (const step of steps) for (const p of step.pixels) canvas[p] = step.color;
  return canvas;
}

/** How long each action lasts: strokes share the drawing time by length; buckets and touches are fixed. */
export function planActions(steps: ILiveStep[], alive: ILiveAliveFrame[]): TLiveAction[] {
  const t = LIVE_TIMING;
  const strokes = steps.filter((s) => s.tool === "brush" && s.kind !== "touch");
  const buckets = steps.filter((s) => s.tool === "bucket");
  const strokePixels = strokes.reduce((sum, s) => sum + s.pixels.length, 0);
  const perPixel = Math.max(
    t.minFramesPerPixel,
    (t.draw - strokes.length * t.minStroke - buckets.length * t.bucket) / Math.max(1, strokePixels),
  );
  const actions: TLiveAction[] = [{ kind: "wait", frames: t.intro }];
  steps.forEach((step, i) => {
    const frames =
      step.tool === "bucket"
        ? t.bucket
        : step.kind === "touch"
          ? Math.max(t.touch, Math.round(step.pixels.length * t.minFramesPerPixel))
          : Math.max(t.minStroke, Math.round(step.pixels.length * perPixel));
    actions.push({ kind: "step", step, frames });
    const next = steps[i + 1];
    if (!next || next.kind !== step.kind) {
      actions.push({ kind: "wait", frames: step.kind === "touch" ? t.touchPause : t.pause });
    }
  });
  actions.push({ kind: "rest", frames: t.rest });
  for (const frame of alive) actions.push({ kind: "alive", frame });
  actions.push({ kind: "export", frames: t.export });
  actions.push({ kind: "rest", frames: t.hold });
  actions.push({ kind: "fade", frames: t.fade });
  return actions;
}

export function prepareDrawing(drawing: ILiveDrawing): ILivePreparedDrawing {
  const steps = buildSteps(drawing);
  return {
    id: drawing.id,
    size: drawing.rows.length,
    pixels: decodeDrawing(drawing.rows),
    steps,
    actions: planActions(steps, drawing.alive),
  };
}

/**
 * RGBA bytes for a canvas of palette indices; `override` pixels (an alive frame) show instead.
 * Index 255 stays transparent.
 */
export function pixelsToRgba(
  pixels: Uint8Array,
  palette: string[],
  override: Map<number, number> | null,
): Uint8ClampedArray<ArrayBuffer> {
  const rgb = palette.map((hex) => Number.parseInt(hex.slice(1), 16));
  const out = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i += 1) {
    const index = override?.get(i) ?? pixels[i];
    if (index === LIVE_EMPTY) continue;
    const value = rgb[index];
    out[i * 4] = (value >> 16) & 255;
    out[i * 4 + 1] = (value >> 8) & 255;
    out[i * 4 + 2] = value & 255;
    out[i * 4 + 3] = 255;
  }
  return out;
}
