import type { IArtwork } from "@/features/shared/artwork/artwork.type";
export type TEditorSettingsView =
  | "menu"
  | "canvasSize"
  | "imageDetail"
  | "importExport";

export interface IUseCanvasSizePanelParams {
  artwork: IArtwork;
  initialView?: TEditorSettingsView;
  onApplyResized: (next: IArtwork) => void;
}
