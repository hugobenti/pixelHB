/**
 * Purpose:
 * Artwork persistence layer shared by the editor and gallery: IndexedDB access for artworks
 * (CRUD, clone, thumbnail updates) plus dimension/palette limits and validation.
 *
 * Notes:
 * New artworks honor `backgroundColor`: pixels are filled with that palette index, appending the
 * color to the palette when it is not already present (up to MAX_PALETTE_ENTRIES).
 */
import { shared } from "@/content/shared";
import { db } from "@/features/shared/db/dexie.config";
import type { IArtwork, IArtworkLayer, IArtworkSummary } from "@/features/shared/artwork/artwork.type";
import type { IImportedArtworkData } from "@/features/shared/artwork/artworkFileService.type";
import { normalizeHexColor } from "@/features/shared/utils/colorConverter";
import { clonePixelBuffer, ensureUint8PixelData } from "@/features/shared/utils/binaryHelpers";
import { MAX_PALETTE_ENTRIES, validateDimensions } from "./artworkLimits";
import type { ICreateArtworkInput } from "./artworkService.type";

const CANON_HEX6 = /^#[0-9A-F]{6}$/;

/** Pixel value for "no color": any value at or above the palette length draws nothing; 255 is the one written. */
export const TRANSPARENT_PIXEL_INDEX = 255;

/**
 * Starter palette for new artworks: Sweetie 16 by GrafxKid. Index 0 (darkest) is the primary
 * painting slot and index 1 (lightest) the secondary slot and default background; the rest follow
 * the palette's warm-to-cool order.
 */
export const DEFAULT_PALETTE: string[] = [
  "#1A1C2C",
  "#F4F4F4",
  "#5D275D",
  "#B13E53",
  "#EF7D57",
  "#FFCD75",
  "#A7F070",
  "#38B764",
  "#257179",
  "#29366F",
  "#3B5DC9",
  "#41A6F6",
  "#73EFF7",
  "#94B0C2",
  "#566C86",
  "#333C57",
];

function newId(): string {
  return crypto.randomUUID();
}

function cloneLayerWithSize(
  layer: IArtworkLayer,
  pixelCount: number
): IArtworkLayer {
  return {
    ...layer,
    visible: layer.visible !== false,
    pixelData: ensureUint8PixelData(layer.pixelData, pixelCount),
  };
}

function buildFallbackLayer(pixelCount: number): IArtworkLayer {
  return {
    id: newId(),
    name: shared.artwork.backgroundLayer,
    visible: true,
    pixelData: new Uint8Array(pixelCount),
  };
}

export async function listArtworkSummaries(): Promise<IArtworkSummary[]> {
  const summaries: IArtworkSummary[] = [];
  await db.artworks
    .orderBy("updatedAt")
    .reverse()
    .each((row) => {
      summaries.push({
        id: row.id,
        title: row.title,
        width: row.width,
        height: row.height,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        thumbnail: row.thumbnail,
      });
    });
  return summaries;
}

export async function getArtwork(id: string): Promise<IArtwork | undefined> {
  const row = await db.artworks.get(id);
  return row ? hydrateArtwork(row) : undefined;
}

function hydrateArtwork(row: IArtwork): IArtwork {
  const n = row.width * row.height;
  const referenceImageDataUrl =
    typeof row.referenceImageDataUrl === "string" &&
    row.referenceImageDataUrl.length > 0
      ? row.referenceImageDataUrl
      : undefined;
  const legacyPixels = ensureUint8PixelData(row.pixelData, n);
  const layers =
    Array.isArray(row.layers) && row.layers.length > 0
      ? row.layers.map((layer) => cloneLayerWithSize(layer, n))
      : [
          {
            id: newId(),
            name: shared.artwork.backgroundLayer,
            visible: true,
            pixelData: legacyPixels,
          },
        ];
  const activeLayerId =
    layers.find((layer) => layer.id === row.activeLayerId)?.id ?? layers[0].id;

  return {
    ...row,
    pixelData: undefined,
    layers,
    activeLayerId,
    palette: [...row.palette],
    referenceImageDataUrl,
  };
}

export async function createArtwork(input: ICreateArtworkInput): Promise<IArtwork> {
  validateDimensions(input.width, input.height);
  const bgHex = normalizeHexColor(input.backgroundColor.trim());
  if (!CANON_HEX6.test(bgHex)) {
    throw new Error(shared.artwork.errors.invalidBackgroundColor);
  }

  let palette = DEFAULT_PALETTE.slice(0, MAX_PALETTE_ENTRIES);
  let bgIndex = palette.findIndex(
    (entry) => normalizeHexColor(entry) === bgHex
  );
  if (bgIndex === -1) {
    if (palette.length >= MAX_PALETTE_ENTRIES) {
      throw new Error(shared.artwork.errors.backgroundPaletteFull);
    }
    palette = [...palette, bgHex];
    bgIndex = palette.length - 1;
  }

  const now = Date.now();
  const pixelData = new Uint8Array(input.width * input.height);
  pixelData.fill(bgIndex);
  const baseLayer: IArtworkLayer = {
    id: newId(),
    name: shared.artwork.backgroundLayer,
    visible: true,
    pixelData,
  };

  const artwork: IArtwork = {
    id: newId(),
    title: input.title.trim() || shared.artwork.untitled,
    width: input.width,
    height: input.height,
    createdAt: now,
    updatedAt: now,
    thumbnail: "",
    palette,
    layers: [baseLayer],
    activeLayerId: baseLayer.id,
    referenceImageDataUrl: undefined,
  };

  await db.artworks.put(artwork);
  return hydrateArtwork(artwork);
}

export async function createArtworkFromImport(
  imported: IImportedArtworkData
): Promise<IArtwork> {
  validateDimensions(imported.width, imported.height);
  if (imported.palette.length === 0) {
    throw new Error(shared.artwork.errors.importedPaletteEmpty);
  }
  if (imported.palette.length > MAX_PALETTE_ENTRIES) {
    throw new Error(shared.artwork.errors.paletteTooLarge(MAX_PALETTE_ENTRIES));
  }

  const now = Date.now();
  const layers =
    imported.layers.length > 0
      ? imported.layers.map((layer) => ({
          ...layer,
          pixelData: clonePixelBuffer(layer.pixelData),
          visible: layer.visible !== false,
        }))
      : [buildFallbackLayer(imported.width * imported.height)];
  const activeLayerId =
    layers.find((layer) => layer.id === imported.activeLayerId)?.id ?? layers[0].id;

  const artwork: IArtwork = {
    id: newId(),
    title: imported.title.trim() || shared.artwork.untitled,
    width: imported.width,
    height: imported.height,
    createdAt: now,
    updatedAt: now,
    thumbnail: "",
    palette: [...imported.palette],
    layers,
    activeLayerId,
    referenceImageDataUrl: imported.referenceImageDataUrl,
  };

  await db.artworks.put(artwork);
  return hydrateArtwork(artwork);
}

export async function saveArtwork(artwork: IArtwork): Promise<void> {
  validateDimensions(artwork.width, artwork.height);
  if (artwork.palette.length > MAX_PALETTE_ENTRIES) {
    throw new Error(shared.artwork.errors.paletteTooLarge(MAX_PALETTE_ENTRIES));
  }
  const pixelCount = artwork.width * artwork.height;
  const normalizedLayers =
    artwork.layers.length > 0
      ? artwork.layers.map((layer) => cloneLayerWithSize(layer, pixelCount))
      : [buildFallbackLayer(pixelCount)];
  const activeLayerId =
    normalizedLayers.find((layer) => layer.id === artwork.activeLayerId)?.id ??
    normalizedLayers[0].id;
  const toStore: IArtwork = {
    ...artwork,
    updatedAt: Date.now(),
    layers: normalizedLayers.map((layer) => ({
      ...layer,
      pixelData: clonePixelBuffer(layer.pixelData),
    })),
    activeLayerId,
    pixelData: undefined,
    palette: [...artwork.palette],
    referenceImageDataUrl: artwork.referenceImageDataUrl,
  };
  await db.artworks.put(toStore);
}

export async function deleteArtwork(id: string): Promise<void> {
  await db.artworks.delete(id);
}

export async function renameArtwork(id: string, title: string): Promise<void> {
  await db.artworks.update(id, {
    title: title.trim() || shared.artwork.untitled,
    updatedAt: Date.now(),
  });
}

/** Stores a regenerated thumbnail; leaves `updatedAt` alone so the gallery order doesn't change. */
export async function saveThumbnail(id: string, thumbnail: string): Promise<void> {
  await db.artworks.update(id, { thumbnail });
}

export async function cloneArtwork(id: string): Promise<IArtwork | undefined> {
  const source = await getArtwork(id);
  if (!source) return undefined;

  const now = Date.now();
  const clone: IArtwork = {
    ...source,
    id: newId(),
    title: shared.artwork.copyTitle(source.title),
    createdAt: now,
    updatedAt: now,
    thumbnail: source.thumbnail,
    layers: source.layers.map((layer) => ({
      ...layer,
      pixelData: clonePixelBuffer(layer.pixelData),
    })),
    palette: [...source.palette],
    activeLayerId: source.activeLayerId,
    pixelData: undefined,
    referenceImageDataUrl: source.referenceImageDataUrl,
  };

  await db.artworks.put(clone);
  return hydrateArtwork(clone);
}
