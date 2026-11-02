/**
 * Purpose:
 * Switching between the editor's tools: pan, bucket, eraser and the color picker are exclusive (brush is none of
 * them), and the picker gives back the paint tool it was armed from when cancelled: bucket, eraser or the brush (never pan).
 * A completed pick from the eraser returns to the brush.
 * A quick Alt pick turns the eraser off (back to the brush): picking a color means you want to paint.
 */

import type { IEditorToolState, TEditorToolAction, TPickerReturnTool } from "./editorTools.type";

const BRUSH: IEditorToolState = {
  panMode: false,
  bucketMode: false,
  eraserMode: false,
  pickerArmed: false,
  pickerReturnTool: "brush",
};

/** Disarms the picker and restores the paint tool it remembered. */
function disarmPicker(state: IEditorToolState): IEditorToolState {
  return {
    ...BRUSH,
    bucketMode: state.pickerReturnTool === "bucket",
    eraserMode: state.pickerReturnTool === "eraser",
  };
}

/** The paint tool to give back when the picker is cancelled (pan is never restored). */
function returnToolFor(state: IEditorToolState): TPickerReturnTool {
  if (state.bucketMode) {
    return "bucket";
  }
  return state.eraserMode ? "eraser" : "brush";
}

export function applyToolAction(state: IEditorToolState, action: TEditorToolAction): IEditorToolState {
  switch (action) {
    case "selectBrush":
      return BRUSH;
    case "togglePan":
      return state.panMode ? BRUSH : { ...BRUSH, panMode: true };
    case "toggleBucket":
      return state.bucketMode ? BRUSH : { ...BRUSH, bucketMode: true };
    case "toggleEraser":
      return state.eraserMode ? BRUSH : { ...BRUSH, eraserMode: true };
    case "togglePicker":
      return state.pickerArmed
        ? disarmPicker(state)
        : { ...BRUSH, pickerArmed: true, pickerReturnTool: returnToolFor(state) };
    case "pickApplied":
      if (state.pickerArmed) {
        // Picking a color means you want to paint, so the eraser is not restored.
        return state.pickerReturnTool === "eraser" ? BRUSH : disarmPicker(state);
      }
      // A quick (Alt-hold) pick while erasing: the user picked a color to paint with.
      return state.eraserMode ? BRUSH : state;
  }
}

/**
 * Picking a swatch means you want to paint: the eraser turns off, and an eraser the picker would hand back is
 * forgotten. Other tools stay.
 */
export function toolsAfterSwatchPick(state: IEditorToolState): IEditorToolState {
  if (state.eraserMode) {
    return BRUSH;
  }
  if (state.pickerArmed && state.pickerReturnTool === "eraser") {
    return { ...state, pickerReturnTool: "brush" };
  }
  return state;
}

/** The brush is the tool when no other tool flag is on. */
export function isBrushTool(state: IEditorToolState): boolean {
  return !state.panMode && !state.bucketMode && !state.eraserMode && !state.pickerArmed;
}
