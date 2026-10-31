import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import type { IExportScaleOption } from "./hooks/useImportExportPanel.type";

export interface IEditorSettingsImportExportPanelProps {
  scaleOptions: IExportScaleOption[];
  onSelectScale: (scale: TExportScale) => void;
  credit: boolean;
  /** Shown instead of the usual hint when the chosen size is too narrow for the strip. */
  creditHint: string | null;
  onCreditChange: (on: boolean) => void;
  onShare: () => void;
  shareDisabled: boolean;
  shareLabel: string;
  /** The size Share produces, e.g. "1024 × 1106 with the PixelHB strip". */
  shareSizeLabel: string;
  onDownloadPng: () => void;
  onExportJson: () => void;
}
