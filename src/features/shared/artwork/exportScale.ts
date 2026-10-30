/**
 * Purpose:
 * Pure rules for which PNG export scales an artwork may use, and the size each produces.
 */
import type { IExportArtSize, IExportSize, TExportScale, TStripHeight } from "./exportScale.type";

export const EXPORT_SCALES = [1, 4, 8, 16, 32] as const;
export const MAX_EXPORT_EDGE_PX = 4096;
const DEFAULT_TARGET_EDGE_PX = 1024;

/** Strip height for exports without a credit strip. */
export const noStrip: TStripHeight = () => 0;

export function exportSize(
  art: IExportArtSize,
  scale: TExportScale,
  stripHeight: TStripHeight,
): IExportSize {
  const width = art.width * scale;
  const artHeight = art.height * scale;
  return { width, height: artHeight + stripHeight(width), artHeight };
}

export function allowedExportScales(
  art: IExportArtSize,
  stripHeight: TStripHeight,
): TExportScale[] {
  return EXPORT_SCALES.filter((scale) => {
    const size = exportSize(art, scale, stripHeight);
    return Math.max(size.width, size.height) <= MAX_EXPORT_EDGE_PX;
  });
}

export function defaultExportScale(art: IExportArtSize, stripHeight: TStripHeight): TExportScale {
  const allowed = allowedExportScales(art, stripHeight);
  const reaching = allowed.find((scale) => {
    const size = exportSize(art, scale, stripHeight);
    return Math.max(size.width, size.height) >= DEFAULT_TARGET_EDGE_PX;
  });
  return reaching ?? allowed[allowed.length - 1] ?? 1;
}

export function resolveExportScale(
  stored: TExportScale | null,
  art: IExportArtSize,
  stripHeight: TStripHeight,
): TExportScale {
  if (stored !== null && allowedExportScales(art, stripHeight).includes(stored)) {
    return stored;
  }
  return defaultExportScale(art, stripHeight);
}
