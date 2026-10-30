import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import type { IExportScaleOption } from "./hooks/useImportExportPanel.type";

export interface IEditorSettingsImportExportPanelProps {
  scaleOptions: IExportScaleOption[];
  onSelectScale: (scale: TExportScale) => void;
  onExportPng: () => void;
  onExportJson: () => void;
}
