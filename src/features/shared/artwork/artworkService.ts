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
import type { IArtworkSyncState, IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import type { IImportedArtworkData } from "@/features/shared/artwork/artworkFileService.type";
import { normalizeHexColor } from "@/features/shared/utils/colorConverter";
import { clonePixelBuffer, ensureUint8PixelData } from "@/features/shared/utils/binaryHelpers";
import { MAX_PALETTE_ENTRIES, validateDimensions } from "./artworkLimits";
import type { ICreateArtworkInput } from "./artworkService.type";

const CANON_HEX6 = /^#[0-9A-F]{6}$/;

let activeOwner: string | null = null;
const changeListeners = new Set<(id: string) => void>();

/** Scopes every read and write to one account; `null` is the signed-out gallery. */
export function setActiveOwner(ownerId: string | null): void {
  activeOwner = ownerId;
}

/** Fires after create, import, clone, save, rename and delete resolve; never for thumbnails or sync-store writes. */
export function onArtworkChanged(listener: (id: string) => void): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function emitChanged(id: string): void {
  for (const listener of changeListeners) listener(id);
}

function newRowSync(owner: string | null): IArtworkSyncState {
  return { state: owner ? "dirty" : "local", syncedUpdatedAt: null };
}

function editedRowSync(owner: string | null, stored: IArtworkSyncState): IArtworkSyncState {
  return owner ? { state: "dirty", syncedUpdatedAt: stored.syncedUpdatedAt } : stored;
}

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
  const owner = activeOwner;
  const summaries: IArtworkSummary[] = [];
  await db.artworks
    .orderBy("updatedAt")
    .reverse()
    .filter((row) => row.ownerId === owner)
    .each((row) => {
      summaries.push({
        id: row.id,
        title: row.title,
        width: row.width,
        height: row.height,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        thumbnail: row.thumbnail,
        syncState: row.sync.state,
      });
    });
  return summaries;
}

export async function getArtwork(id: string): Promise<IArtwork | undefined> {
  const row = await db.artworks.get(id);
  return row && row.ownerId === activeOwner ? hydrateArtwork(row) : undefined;
}

/** Normalizes layers and palette of a stored row; extra fields (owner, sync) pass through. */
export function hydrateArtwork<T extends IArtwork>(row: T): T {
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

  const owner = activeOwner;
  const now = Date.now();
  const pixelData = new Uint8Array(input.width * input.height);
  pixelData.fill(bgIndex);
  const baseLayer: IArtworkLayer = {
    id: newId(),
    name: shared.artwork.backgroundLayer,
    visible: true,
    pixelData,
  };

  const artwork: IStoredArtwork = {
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
    ownerId: owner,
    sync: newRowSync(owner),
  };

  await db.artworks.put(artwork);
  emitChanged(artwork.id);
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

  const owner = activeOwner;
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

  const artwork: IStoredArtwork = {
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
    ownerId: owner,
    sync: newRowSync(owner),
  };

  await db.artworks.put(artwork);
  emitChanged(artwork.id);
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
  const owner = activeOwner;
  const edited: IArtwork = {
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
  const written = await db.transaction("rw", db.artworks, async () => {
    const stored = await db.artworks.get(artwork.id);
    if (!stored || stored.ownerId !== owner) return false;
    await db.artworks.put({
      ...edited,
      ownerId: stored.ownerId,
      sync: editedRowSync(owner, stored.sync),
    });
    return true;
  });
  if (written) emitChanged(artwork.id);
}

export async function deleteArtwork(id: string): Promise<void> {
  const owner = activeOwner;
  const deleted = await db.transaction("rw", db.artworks, db.deletions, async () => {
    const row = await db.artworks.get(id);
    if (!row || row.ownerId !== owner) return false;
    await db.artworks.delete(id);
    if (row.ownerId !== null && row.sync.syncedUpdatedAt !== null) {
      await db.deletions.put({ id, ownerId: row.ownerId, deletedAt: Date.now() });
    }
    return true;
  });
  if (deleted) emitChanged(id);
}

export async function renameArtwork(id: string, title: string): Promise<void> {
  const owner = activeOwner;
  const renamed = await db.transaction("rw", db.artworks, async () => {
    const stored = await db.artworks.get(id);
    if (!stored || stored.ownerId !== owner) return false;
    await db.artworks.put({
      ...stored,
      title: title.trim() || shared.artwork.untitled,
      updatedAt: Date.now(),
      sync: editedRowSync(owner, stored.sync),
    });
    return true;
  });
  if (renamed) emitChanged(id);
}

/** Stores a regenerated thumbnail; leaves `updatedAt` alone so the gallery order doesn't change. */
export async function saveThumbnail(id: string, thumbnail: string): Promise<void> {
  await db.artworks.update(id, { thumbnail });
}

export async function cloneArtwork(id: string): Promise<IArtwork | undefined> {
  const source = await getArtwork(id);
  if (!source) return undefined;

  const owner = activeOwner;
  const now = Date.now();
  const clone: IStoredArtwork = {
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
    ownerId: owner,
    sync: newRowSync(owner),
  };

  await db.artworks.put(clone);
  emitChanged(clone.id);
  return hydrateArtwork(clone);
}
