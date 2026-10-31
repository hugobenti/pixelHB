import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";

export interface IEditorToolBarProps {
  primaryColor: string;
  secondaryColor: string;
  activeSlot: TColorSlot;
  onToggleActiveSlot: () => void;
  /** No tool flag is on: the brush is the active tool. */
  brushMode: boolean;
  onSelectBrush: () => void;
  panMode: boolean;
  onTogglePanMode: () => void;
  bucketMode: boolean;
  onToggleBucketMode: () => void;
  eraserMode: boolean;
  onToggleEraserMode: () => void;
  /** Picker armed, or Alt held for a quick pick. */
  pickerPressed: boolean;
  onTogglePicker: () => void;
  canZoomOut: boolean;
  canZoomIn: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  shiftOverlayOpen: boolean;
  onToggleShiftOverlay: () => void;
}
