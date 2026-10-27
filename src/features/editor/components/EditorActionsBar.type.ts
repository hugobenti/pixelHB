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
  /** Picker armed, or Alt held for a quick pick. */
  pickerPressed: boolean;
  onTogglePicker: () => void;
  canZoomOut: boolean;
  canZoomIn: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  shiftOverlayOpen: boolean;
  onToggleShiftOverlay: () => void;
  layersDrawerOpen: boolean;
  onToggleLayersDrawer: () => void;
  settingsDrawerOpen: boolean;
  onToggleSettingsDrawer: () => void;
}
