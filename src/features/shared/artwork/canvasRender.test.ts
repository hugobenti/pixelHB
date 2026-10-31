import { describe, expect, test } from "vitest";

import { renderCanvas } from "./canvasRender";

function fakeCtx() {
  const calls: string[] = [];
  const ctx = {
    canvas: { width: 10, height: 10 },
    fillStyle: "",
    imageSmoothingEnabled: true,
    clearRect: () => calls.push("clearRect"),
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    translate: () => {},
    scale: () => {},
    fillRect: () => calls.push("fillRect"),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const artwork = {
  width: 1,
  height: 1,
  palette: ["#000000"],
  layers: [{ visible: true, pixelData: new Uint8Array([0]) }],
} as unknown as Parameters<typeof renderCanvas>[1];
const viewport = { scale: 1, viewOffset: { x: 0, y: 0 } };

describe("renderCanvas clear option", () => {
  test("clears the canvas by default", () => {
    const { ctx, calls } = fakeCtx();
    renderCanvas(ctx, artwork, viewport);
    expect(calls).toContain("clearRect");
  });

  test("does not clear with { clear: false }", () => {
    const { ctx, calls } = fakeCtx();
    renderCanvas(ctx, artwork, viewport, { clear: false });
    expect(calls).not.toContain("clearRect");
    expect(calls).toContain("fillRect");
  });
});
