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
  /** Layer shown in the chip; null while the artwork has none. */
  activeLayer: IArtworkLayer | null;
  palette: string[];
  width: number;
  height: number;
  /** Bumps on stroke commit, undo and redo, so the chip preview follows in-place edits. */
  historyRevision: number;
  layersDrawerOpen: boolean;
  onToggleLayersDrawer: () => void;
  onOpenExport: () => void;
  settingsDrawerOpen: boolean;
  onToggleSettingsDrawer: () => void;
}
