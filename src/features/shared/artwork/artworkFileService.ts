/**
 * Purpose:
 * Serialize artwork documents for JSON import/export and render PNG snapshots for download.
 *
 * Notes:
 * Exported JSON uses a versioned schema with Base64-encoded layer buffers for compact files.
 */
"use client";

import { shared } from "@/content/shared";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { parseArtworkFile, serializeArtworkFile } from "./artworkFileFormat";
import type { IImportedArtworkData } from "./artworkFileService.type";

const errors = shared.artworkFile.errors;

const JSON_MIME = "application/json";
const PNG_MIME = "image/png";

function sanitizeFileNameSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "artwork";
  }
  return trimmed.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/-+/g, "-");
}

function triggerFileDownload(blob: Blob, fileName: string): void {
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

function drawArtworkToCanvas(artwork: IArtwork): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = artwork.width;
  canvas.height = artwork.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(errors.canvasUnavailable);
  }

  ctx.clearRect(0, 0, artwork.width, artwork.height);
  for (let layerIndex = artwork.layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const layer = artwork.layers[layerIndex];
    if (!layer.visible) {
      continue;
    }
    for (let y = 0; y < artwork.height; y += 1) {
      for (let x = 0; x < artwork.width; x += 1) {
        const pixelIndex = x + y * artwork.width;
        const color = artwork.palette[layer.pixelData[pixelIndex]] ?? "transparent";
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

export async function exportArtworkAsPng(artwork: IArtwork): Promise<void> {
  const canvas = drawArtworkToCanvas(artwork);
  const fileName = `${sanitizeFileNameSegment(artwork.title)}.png`;
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, PNG_MIME);
  });
  if (blob) {
    triggerFileDownload(blob, fileName);
    return;
  }

  const fallbackUrl = canvas.toDataURL(PNG_MIME);
  const anchor = document.createElement("a");
  anchor.href = fallbackUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
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
