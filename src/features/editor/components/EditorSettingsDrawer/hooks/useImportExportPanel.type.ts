import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";

export interface IUseImportExportPanelParams {
  artwork: IArtwork;
}

export interface IExportScaleOption {
  scale: TExportScale;
  label: string;
  pressed: boolean;
  disabled: boolean;
  /** Accessible description of a disabled option; `undefined` when enabled. */
  description: string | undefined;
  descriptionId: string;
}
