import { describe, expect, it } from "vitest";

import { LIVE_DRAWINGS } from "@/features/site/components/liveDrawings.data";

import {
  LIVE_EMPTY,
  LIVE_TIMING,
  buildSteps,
  decodeDrawing,
  floodRegion,
  planActions,
  replaySteps,
} from "./liveCanvas";

describe.each(LIVE_DRAWINGS.map((d) => [d.id, d] as const))("live drawing %s", (_id, drawing) => {
  const size = drawing.rows.length;
  const finished = decodeDrawing(drawing.rows);
  const steps = buildSteps(drawing);

  it("is a square grid", () => {
    expect(drawing.rows.every((row) => row.length === size)).toBe(true);
  });

  it("replays into exactly the finished drawing", () => {
    expect(Array.from(replaySteps(steps, finished.length))).toEqual(Array.from(finished));
  });

  it("fills with the bucket only what one click in the editor would fill", () => {
    const canvas = new Uint8Array(finished.length).fill(LIVE_EMPTY);
    let buckets = 0;
    for (const step of steps) {
      if (step.tool === "bucket") {
        buckets += 1;
        const clicked = floodRegion(canvas, size, step.seed as number);
        expect(new Set(clicked)).toEqual(new Set(step.pixels));
        expect(canvas[step.seed as number]).toBe(LIVE_EMPTY);
        expect(step.pixels.every((p) => finished[p] !== LIVE_EMPTY)).toBe(true);
      }
      for (const p of step.pixels) canvas[p] = step.color;
    }
    expect(buckets).toBeGreaterThan(0);
  });

  it("paints the final touch last", () => {
    const firstTouch = steps.findIndex((s) => s.kind === "touch");
    expect(firstTouch).toBeGreaterThan(0);
    expect(steps.slice(firstTouch).every((s) => s.kind === "touch")).toBe(true);
    const touch = new Set(drawing.touch);
    const early = steps.slice(0, firstTouch).flatMap((s) => s.pixels.map((p) => [p, s.color]));
    expect(early.filter(([p, color]) => touch.has(p) && color === finished[p])).toEqual([]);
  });

  it("never brushes faster than the minimum pace, however many strokes it has", () => {
    const strokes = planActions(steps, drawing.alive).flatMap((a) =>
      a.kind === "step" && a.step.tool === "brush" ? [a] : [],
    );
    for (const { step, frames } of strokes) {
      expect(frames).toBeGreaterThanOrEqual(
        Math.round(step.pixels.length * LIVE_TIMING.minFramesPerPixel),
      );
    }
  });
});
