/** Paint tools the picker can be armed from (pan is never restored). */
export type TPickerReturnTool = "brush" | "bucket" | "eraser";

/** Which editor tool is on. Brush is the state with every flag off. */
export interface IEditorToolState {
  panMode: boolean;
  bucketMode: boolean;
  eraserMode: boolean;
  pickerArmed: boolean;
  /** The paint tool the picker was armed from; cancelling the picker turns it back on. */
  pickerReturnTool: TPickerReturnTool;
}

/** `selectBrush`: back to the brush from any tool. `pickApplied`: a pick hold ended on a color. */
export type TEditorToolAction =
  | "selectBrush"
  | "togglePan"
  | "toggleBucket"
  | "toggleEraser"
  | "togglePicker"
  | "pickApplied";
