/** Which editor tool is on. Brush is the state with every flag off. */
export interface IEditorToolState {
  panMode: boolean;
  bucketMode: boolean;
  eraserMode: boolean;
  pickerArmed: boolean;
  /** The picker was armed from bucket mode, so disarming turns bucket back on. */
  pickerReturnsToBucket: boolean;
}

/** `pickApplied`: a pick hold ended on a color. */
export type TEditorToolAction = "togglePan" | "toggleBucket" | "toggleEraser" | "togglePicker" | "pickApplied";
