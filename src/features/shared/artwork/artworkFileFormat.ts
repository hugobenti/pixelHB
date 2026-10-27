/**
 * Purpose:
 * Pure serialize / parse / validate for the PixelHB artwork file format (v1-v3). No browser-only APIs
 * besides the `btoa`/`atob` globals, so it runs on the server too.
 *
 * Notes:
 * Layers are Base64 in v2/v3. Every byte value is a valid pixel: values at or above the palette length
 * draw nothing (255 is the transparent marker). `parseArtworkFile` never throws; invalid input yields null.
 */
import { shared } from "@/content/shared";
import type { IArtwork, IArtworkLayer } from "./artwork.type";
import type { IArtworkFileV3, IArtworkFileMeta, IParsedArtworkFile } from "./artworkFileService.type";
import { MAX_PALETTE_ENTRIES, validateDimensions } from "./artworkLimits";

const FILE_SCHEMA_VERSION = 3;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const BASE64_CHUNK_BYTES = 0x8000;

function uint8ArrayToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < buffer.length; index += BASE64_CHUNK_BYTES) {
    binary += String.fromCharCode(...buffer.subarray(index, index + BASE64_CHUNK_BYTES));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export function serializeArtworkFile(artwork: IArtwork): IArtworkFileV3 {
  return {
    version: FILE_SCHEMA_VERSION,
    id: artwork.id,
    createdAt: artwork.createdAt,
    updatedAt: artwork.updatedAt,
    title: artwork.title,
    width: artwork.width,
    height: artwork.height,
    palette: [...artwork.palette],
    layers: artwork.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible !== false,
      pixelDataBase64: uint8ArrayToBase64(layer.pixelData),
    })),
    activeLayerId: artwork.activeLayerId,
    referenceImageDataUrl: artwork.referenceImageDataUrl,
  };
}

function invalid(): never {
  throw new Error(shared.artworkFile.errors.invalidFormat);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function readMeta(file: Record<string, unknown>): IArtworkFileMeta | null {
  if (file.version !== 3) {
    return null;
  }
  if (typeof file.id !== "string" || file.id.length === 0) {
    return invalid();
  }
  if (!isTimestamp(file.createdAt) || !isTimestamp(file.updatedAt)) {
    return invalid();
  }
  return { id: file.id, createdAt: file.createdAt, updatedAt: file.updatedAt };
}

function readLayer(
  layer: unknown,
  version: number,
  pixelCount: number,
): IArtworkLayer {
  if (!layer || typeof layer !== "object") {
    return invalid();
  }
  const entry = layer as Record<string, unknown>;
  if (typeof entry.id !== "string" || entry.id.length === 0) {
    return invalid();
  }
  if (typeof entry.name !== "string" || entry.name.length === 0) {
    return invalid();
  }
  let buffer: Uint8Array;
  if (version === 1) {
    const values = entry.pixelData;
    if (!Array.isArray(values) || values.length !== pixelCount) {
      return invalid();
    }
    buffer = new Uint8Array(pixelCount);
    for (let i = 0; i < pixelCount; i += 1) {
      const value = values[i];
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        return invalid();
      }
      buffer[i] = value;
    }
  } else {
    if (typeof entry.pixelDataBase64 !== "string") {
      return invalid();
    }
    buffer = base64ToUint8Array(entry.pixelDataBase64);
    if (buffer.length !== pixelCount) {
      return invalid();
    }
  }
  return { id: entry.id, name: entry.name, visible: entry.visible !== false, pixelData: buffer };
}

function validate(raw: unknown): IParsedArtworkFile {
  if (!raw || typeof raw !== "object") {
    return invalid();
  }
  const file = raw as Record<string, unknown>;
  const version = file.version;
  if (version !== 1 && version !== 2 && version !== 3) {
    return invalid();
  }
  const meta = readMeta(file);
  if (typeof file.title !== "string") {
    return invalid();
  }
  const { width, height } = file;
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return invalid();
  }
  validateDimensions(width as number, height as number);

  const palette = file.palette;
  if (!Array.isArray(palette) || palette.length === 0 || palette.length > MAX_PALETTE_ENTRIES) {
    return invalid();
  }
  for (const color of palette) {
    if (typeof color !== "string" || !HEX_COLOR.test(color)) {
      return invalid();
    }
  }

  if (!Array.isArray(file.layers) || file.layers.length === 0) {
    return invalid();
  }
  const pixelCount = (width as number) * (height as number);
  const layers = file.layers.map((layer) => readLayer(layer, version, pixelCount));

  const activeLayerId =
    typeof file.activeLayerId === "string" && layers.some((layer) => layer.id === file.activeLayerId)
      ? file.activeLayerId
      : layers[0].id;

  if (file.referenceImageDataUrl != null && typeof file.referenceImageDataUrl !== "string") {
    return invalid();
  }

  return {
    meta,
    data: {
      title: file.title.trim() || shared.artwork.untitled,
      width: width as number,
      height: height as number,
      palette: [...(palette as string[])],
      layers,
      activeLayerId,
      referenceImageDataUrl: file.referenceImageDataUrl ?? undefined,
    },
  };
}

export function parseArtworkFile(raw: unknown): IParsedArtworkFile | null {
  try {
    return validate(raw);
  } catch {
    return null;
  }
}
