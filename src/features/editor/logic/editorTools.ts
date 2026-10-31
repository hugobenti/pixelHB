/**
 * Purpose:
 * Switching between the editor's tools: pan, bucket, eraser and the color picker are exclusive (brush is none of
 * them), and the picker gives back the paint tool it was armed from: bucket, or the brush (never pan).
 */

import type { IEditorToolState, TEditorToolAction } from "./editorTools.type";

const BRUSH: IEditorToolState = {
  panMode: false,
  bucketMode: false,
  eraserMode: false,
  pickerArmed: false,
  pickerReturnsToBucket: false,
};

/** Disarms the picker and restores the paint tool it remembered. */
function disarmPicker(state: IEditorToolState): IEditorToolState {
  return { ...BRUSH, bucketMode: state.pickerReturnsToBucket };
}

export function applyToolAction(state: IEditorToolState, action: TEditorToolAction): IEditorToolState {
  switch (action) {
    case "togglePan":
      return state.panMode ? BRUSH : { ...BRUSH, panMode: true };
    case "toggleBucket":
      return state.bucketMode ? BRUSH : { ...BRUSH, bucketMode: true };
    case "toggleEraser":
      return state.eraserMode ? BRUSH : { ...BRUSH, eraserMode: true };
    case "togglePicker":
      return state.pickerArmed
        ? disarmPicker(state)
        : { ...BRUSH, pickerArmed: true, pickerReturnsToBucket: state.bucketMode };
    case "pickApplied":
      if (state.pickerArmed) {
        return disarmPicker(state);
      }
      // A quick (Alt-hold) pick while erasing: the user picked a color to paint with.
      return state.eraserMode ? BRUSH : state;
  }
}
