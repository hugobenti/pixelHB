import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import type { TEditorSettingsView } from "./hooks/useCanvasSizePanel.type";
import type { IViewportState } from "@/features/editor/types/editor.type";

export interface IEditorSettingsDrawerProps {
  artwork: IArtwork;
  /** The view the drawer opens on; Back from it still returns to the menu. Defaults to the menu. */
  initialView?: TEditorSettingsView;
  onApplyCanvasSize: (next: IArtwork) => void;
  viewport: IViewportState;
  viewportCssWidth: number;
  viewportCssHeight: number;
  paintRevision: number;
  showPixelGrid: boolean;
  onToggleGrid: () => void;
  showReferenceImage: boolean;
  hasReferenceImage: boolean;
  onToggleReferenceImage: () => void;
  onLoadReferenceImage: () => void;
  onClose: () => void;
}
