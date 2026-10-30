import type { TShareFrom } from "@/features/shared/analytics/analytics.type";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";

export interface IUseShareImageParams {
  /** Which screen the share came from; sent with the `share` event. */
  from: TShareFrom;
}

export interface IShareAnalytics {
  scale: TExportScale;
}
