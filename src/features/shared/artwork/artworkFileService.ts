/**
 * Purpose:
 * Serialize artwork documents for JSON import/export and render PNG snapshots for download.
 *
 * Notes:
 * Exported JSON uses a versioned schema with Base64-encoded layer buffers for compact files.
 */
"use client";

import { shared } from "@/content/shared";
import { site } from "@/content/site";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { sanitizeFileNameSegment, exportFileName } from "./artworkFileName";
import { composeArtworkRgba } from "./artworkComposite";
import { creditStripHeight, creditStripLayout } from "./creditStrip";
import { drawCreditStrip } from "./creditStripRender";
import { exportSize, noStrip } from "./exportScale";
import type { TExportScale } from "./exportScale.type";
import { pngBlobFromDataUrl } from "./pngPayload";
import { parseArtworkFile, serializeArtworkFile } from "./artworkFileFormat";
import type {
  IExportPngOptions,
  IImportedArtworkData,
  IRenderedPng,
} from "./artworkFileService.type";

const errors = shared.artworkFile.errors;

const JSON_MIME = "application/json";
const PNG_MIME = "image/png";

export function triggerFileDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function exportArtworkAsJson(artwork: IArtwork): void {
  const payload = JSON.stringify(serializeArtworkFile(artwork), null, 2);
  const blob = new Blob([payload], { type: JSON_MIME });
  const fileName = `${sanitizeFileNameSegment(artwork.title)}.json`;
  triggerFileDownload(blob, fileName);
}

async function renderArtworkCanvas(
  artwork: IArtwork,
  scale: TExportScale,
  credit: boolean,
): Promise<{ canvas: HTMLCanvasElement; credit: boolean }> {
  const source = document.createElement("canvas");
  source.width = artwork.width;
  source.height = artwork.height;
  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) {
    throw new Error(errors.canvasUnavailable);
  }
  const pixels = composeArtworkRgba(artwork);
  sourceCtx.putImageData(new ImageData(pixels, artwork.width, artwork.height), 0, 0);

  const size = exportSize(artwork, scale, credit ? creditStripHeight : noStrip);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(errors.canvasUnavailable);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, size.width, size.artHeight);
  const layout = creditStripLayout(size.width);
  const drawn = credit && layout.height > 0;
  if (drawn) {
    await drawCreditStrip(ctx, size.artHeight, layout, new URL(site.url).host);
  }
  return { canvas, credit: drawn };
}

/** Renders the artwork to a PNG at `scale`, without downloading it. */
export async function renderArtworkPng(
  artwork: IArtwork,
  options: IExportPngOptions,
): Promise<IRenderedPng> {
  const { canvas, credit } = await renderArtworkCanvas(artwork, options.scale, options.credit);
  const fileName = exportFileName(artwork.title, options.scale);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, PNG_MIME);
  });
  if (blob) {
    return { blob, credit, fileName };
  }
  return { blob: pngBlobFromDataUrl(canvas.toDataURL(PNG_MIME)), credit, fileName };
}

export async function exportArtworkAsPng(
  artwork: IArtwork,
  options: IExportPngOptions,
): Promise<{ credit: boolean }> {
  const { blob, credit, fileName } = await renderArtworkPng(artwork, options);
  triggerFileDownload(blob, fileName);
  return { credit };
}

export async function importArtworkFromJsonFile(file: File): Promise<IImportedArtworkData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(errors.invalidJson);
  }
  const result = parseArtworkFile(parsed);
  if (!result) {
    throw new Error(errors.invalidFormat);
  }
  return result.data;
}
