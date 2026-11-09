import type { TLiveDrawingId, TLiveTool } from "@/features/site/logic/liveCanvas.type";

export interface IShowcaseTool {
  /** The live tool this button stands for; the others never press. */
  tool: TLiveTool | null;
  icon: string;
}

/** What the miniature editor shows around the canvas at this moment. */
export interface IShowcaseView {
  drawingId: TLiveDrawingId;
  tool: TLiveTool | null;
  /** Palette index in the primary slot. */
  color: number;
  status: string;
  faded: boolean;
}
