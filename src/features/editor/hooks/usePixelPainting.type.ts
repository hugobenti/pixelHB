import type { RefObject } from "react";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type {
  IHistoryCommand,
  IViewportState,
} from "@/features/editor/types/editor.type";
import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";

export interface IUsePixelPaintingParams {
  artwork: IArtwork;
  activeLayerId: string | null;
  /** When false and `activeLayerId` is set, paint gestures are ignored (layer hidden in UI). */
  activeLayerVisible: boolean;
  activeLayerPixelData: Uint8Array | null;
  viewport: IViewportState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeSlot: TColorSlot;
  primaryPaletteIndex: number;
  secondaryPaletteIndex: number;
  onCommitStroke: (cmd: IHistoryCommand) => void;
  onPixelsChanged: () => void;
  /** When true, primary-button painting is skipped (Space pan / pan mode). */
  deferPrimaryPaint?: () => boolean;
  /** True enables one-shot flood fill on pointer down. */
  bucketMode?: boolean;
  /** True paints transparent on both mouse buttons (the eraser ignores color slots). */
  eraserMode?: boolean;
  /** Shared touch Set from useEditorPointerContacts; hook order must place contacts before painting. */
  touchPointersRef: RefObject<Set<number>>;
  /** Fires when the user tries to paint while the active layer is hidden. */
  onHiddenActiveLayerPaintAttempt?: () => void;
}
