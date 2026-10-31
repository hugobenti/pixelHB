/**
 * Purpose:
 * Tests for switching between the editor's tools: pan, bucket, eraser and the color picker are exclusive, and
 * the picker hands back the paint tool it was armed from; picking from the eraser returns to the brush.
 */

import { describe, expect, it } from "vitest";

import { applyToolAction } from "@/features/editor/logic/editorTools";
import type { IEditorToolState } from "@/features/editor/logic/editorTools.type";

const BRUSH: IEditorToolState = {
  panMode: false,
  bucketMode: false,
  eraserMode: false,
  pickerArmed: false,
  pickerReturnTool: "brush",
};

describe("applyToolAction", () => {
  it("arms the picker from the brush", () => {
    expect(applyToolAction(BRUSH, "togglePicker")).toEqual({
      panMode: false,
      bucketMode: false,
      eraserMode: false,
      pickerArmed: true,
      pickerReturnTool: "brush",
    });
  });

  it("turns bucket off while the picker is armed and back on when it is disarmed", () => {
    const armed = applyToolAction({ ...BRUSH, bucketMode: true }, "togglePicker");
    expect(armed).toMatchObject({ pickerArmed: true, bucketMode: false, pickerReturnTool: "bucket" });
    expect(applyToolAction(armed, "togglePicker")).toMatchObject({ pickerArmed: false, bucketMode: true });
  });

  it("returns to the bucket after a pick when armed from bucket", () => {
    const armed = applyToolAction({ ...BRUSH, bucketMode: true }, "togglePicker");
    expect(applyToolAction(armed, "pickApplied")).toMatchObject({ pickerArmed: false, bucketMode: true });
  });

  it("returns to the brush, not pan, when armed from pan", () => {
    const armed = applyToolAction({ ...BRUSH, panMode: true }, "togglePicker");
    expect(armed).toMatchObject({ pickerArmed: true, panMode: false });
    expect(applyToolAction(armed, "pickApplied")).toEqual(BRUSH);
  });

  it("leaves the tools alone after a quick pick (picker not armed)", () => {
    const bucket = { ...BRUSH, bucketMode: true };
    expect(applyToolAction(bucket, "pickApplied")).toEqual(bucket);
  });

  it("disarms the picker without restoring when pan or bucket is chosen", () => {
    const armedFromBucket = applyToolAction({ ...BRUSH, bucketMode: true }, "togglePicker");
    expect(applyToolAction(armedFromBucket, "togglePan")).toEqual({ ...BRUSH, panMode: true });
    expect(applyToolAction(applyToolAction(BRUSH, "togglePicker"), "toggleBucket")).toEqual({
      ...BRUSH,
      bucketMode: true,
    });
  });

  it("keeps pan and bucket exclusive", () => {
    expect(applyToolAction({ ...BRUSH, bucketMode: true }, "togglePan")).toEqual({ ...BRUSH, panMode: true });
    expect(applyToolAction({ ...BRUSH, panMode: true }, "toggleBucket")).toEqual({ ...BRUSH, bucketMode: true });
    expect(applyToolAction({ ...BRUSH, panMode: true }, "togglePan")).toEqual(BRUSH);
  });

  it("turns the eraser on from the brush with every other flag off, and back to the brush", () => {
    const erasing = applyToolAction(BRUSH, "toggleEraser");
    expect(erasing).toEqual({ ...BRUSH, eraserMode: true });
    expect(applyToolAction(erasing, "toggleEraser")).toEqual(BRUSH);
    expect(applyToolAction({ ...BRUSH, bucketMode: true }, "toggleEraser")).toEqual({ ...BRUSH, eraserMode: true });
    expect(applyToolAction({ ...BRUSH, panMode: true }, "toggleEraser")).toEqual({ ...BRUSH, eraserMode: true });
  });

  it("turns the eraser off when bucket, pan or the picker is chosen", () => {
    const erasing = { ...BRUSH, eraserMode: true };
    expect(applyToolAction(erasing, "toggleBucket")).toEqual({ ...BRUSH, bucketMode: true });
    expect(applyToolAction(erasing, "togglePan")).toEqual({ ...BRUSH, panMode: true });
    expect(applyToolAction(erasing, "togglePicker")).toMatchObject({ eraserMode: false, pickerArmed: true });
  });

  it("returns to the brush, not the eraser, after a pick armed from the eraser", () => {
    const armed = applyToolAction({ ...BRUSH, eraserMode: true }, "togglePicker");
    expect(applyToolAction(armed, "pickApplied")).toEqual(BRUSH);
  });

  it("restores the eraser when the picker is armed from it and cancelled without a pick", () => {
    const armed = applyToolAction({ ...BRUSH, eraserMode: true }, "togglePicker");
    expect(armed).toMatchObject({ pickerArmed: true, eraserMode: false, pickerReturnTool: "eraser" });
    expect(applyToolAction(armed, "togglePicker")).toEqual({ ...BRUSH, eraserMode: true });
  });

  it("returns to the brush after a quick pick made while erasing", () => {
    expect(applyToolAction({ ...BRUSH, eraserMode: true }, "pickApplied")).toEqual(BRUSH);
  });
});
