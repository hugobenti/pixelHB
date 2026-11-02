import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export interface IEditorActionsBarProps {
  title: string;
  /** The open artwork: scopes the sync status to it. */
  artworkId: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
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
