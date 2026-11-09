/** One frame of a drawing's resting animation: these pixels show instead of the drawing's own. */
export interface ILiveAliveFrame {
  frames: number;
  /** `[pixel index, palette index]`; 255 is transparent. An empty list shows the drawing as is. */
  pixels: [number, number][];
}

/** An illustrative drawing for the Home live canvas, in the starter palette. */
export interface ILiveDrawing {
  id: TLiveDrawingId;
  /** One string per row: `.` is transparent, a hex digit is a starter-palette index. */
  rows: string[];
  /** Pixel indices painted last, the drawing's final touch (eyes, a flower, the veins of a leaf). */
  touch: number[];
  /** True when the final touch is a shape of its own, outlined and filled after the rest. */
  touchSeparate: boolean;
  alive: ILiveAliveFrame[];
}

export type TLiveDrawingId = "cat" | "robin" | "pitbull" | "monstera" | "cactus";

export type TLiveTool = "brush" | "bucket";

/** What a step is doing, named in the status line. */
export type TLiveStepKind = "outline" | "fill" | "shadow" | "color" | "light" | "touch";

/** One tool action in the editor: a brush stroke or a bucket click. */
export interface ILiveStep {
  tool: TLiveTool;
  /** Palette index painted. */
  color: number;
  kind: TLiveStepKind;
  /** Pixels in the order they are painted; a bucket paints them all at once. */
  pixels: number[];
  /** Where the bucket is clicked. */
  seed?: number;
}

export type TLiveAction =
  | { kind: "step"; step: ILiveStep; frames: number }
  | { kind: "wait"; frames: number }
  | { kind: "rest"; frames: number }
  | { kind: "alive"; frame: ILiveAliveFrame }
  | { kind: "export"; frames: number }
  | { kind: "fade"; frames: number };

/** A drawing decoded and turned into a timeline, ready to play. */
export interface ILivePreparedDrawing {
  id: TLiveDrawingId;
  size: number;
  /** The finished drawing, palette indices with 255 for transparent. */
  pixels: Uint8Array;
  steps: ILiveStep[];
  actions: TLiveAction[];
}
