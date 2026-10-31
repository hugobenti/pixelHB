import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";
import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";

export interface IEditorActionsBarProps {
  title: string;
  /** The open artwork: scopes the sync status to it. */
  artworkId: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  activeSlot: TColorSlot;
  onToggleActiveSlot: () => void;
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
  /** Layer shown in the chip; null while the artwork has none. */
  activeLayer: IArtworkLayer | null;
  palette: string[];
  width: number;
  height: number;
  /** Bumps on every paint, so the chip preview follows in-place strokes. */
  paintRevision: number;
  layersDrawerOpen: boolean;
  onToggleLayersDrawer: () => void;
  settingsDrawerOpen: boolean;
  onToggleSettingsDrawer: () => void;
}
