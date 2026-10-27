/**
 * Purpose:
 * Stores PixelHB artworks in the signed-in user's Google Drive: one `<title>.pixelhb.json` plus one
 * `<title>.png` preview per artwork, inside a `PixelHB` folder created on first save.
 *
 * Notes:
 * Files are found by `appProperties` only, never by name or folder (with the `drive.file` scope a
 * query can only return files this app created). Users may rename or move files freely. The folder is
 * only the `parents` of newly created files. `appProperties.updatedAt` on the JSON is the commit point:
 * the PNG is written first, the JSON last. Duplicate JSON files for one artwork (two concurrent
 * creates) resolve to the newest `updatedAt`. Artwork payloads and file names are never logged.
 */
import { site } from "@/content/site";
import { MAX_CANVAS_DIMENSION } from "@/features/shared/artwork/artworkLimits";
import { ARTWORK_ID_PATTERN, galleryPreviewUrl } from "../galleryApi";
import type { IGalleryListItem } from "../galleryApi.type";
import type {
  IDriveArtworkFiles,
  IDriveArtworkStore,
  IDriveArtworkUpsert,
  TTrashResult,
  TUpsertResult,
} from "./driveArtworkStore.type";
import { createDriveRest } from "./driveRest";
import type { IDriveFile, IDriveFileMetadata, IDriveRestOptions } from "./driveRest.type";

const JSON_SUFFIX = ".pixelhb.json";
const PNG_SUFFIX = ".png";
const FILE_NAME_MAX = 100;
const FORMAT_VERSION = "3";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const JSON_MIME = "application/json";
const PNG_MIME = "image/png";
const ROOT_QUERY = `appProperties has { key='pixelhb' and value='root' } and mimeType='${FOLDER_MIME}' and trashed=false`;
const LIST_QUERY = "appProperties has { key='pixelhb' and value='artwork' } and trashed=false";
const NON_NEGATIVE_INTEGER = /^\d+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
const WHITESPACE_RUNS = /\s+/g;
const MISSING_UPDATED_AT = -1;

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function filesOfArtworkQuery(id: string): string {
  return `appProperties has { key='artworkId' and value='${escapeQueryValue(id)}' } and trashed=false`;
}

export function driveFileBaseName(title: string, id: string): string {
  const cleaned = title.replace(CONTROL_CHARACTERS, " ").replace(WHITESPACE_RUNS, " ").trim();
  const base = Array.from(cleaned).slice(0, FILE_NAME_MAX).join("").trim();
  return base.length > 0 ? base : id;
}

function driveFileName(base: string, suffix: string): string {
  return `${base}${suffix}`;
}

function parseCount(value: string | undefined): number | null {
  if (value === undefined || !NON_NEGATIVE_INTEGER.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseDimension(value: string | undefined): number | null {
  const parsed = parseCount(value);
  return parsed !== null && parsed >= 1 && parsed <= MAX_CANVAS_DIMENSION ? parsed : null;
}

function updatedAtOf(file: IDriveFile): number {
  return parseCount(file.appProperties?.updatedAt) ?? MISSING_UPDATED_AT;
}

function toListItem(file: IDriveFile): IGalleryListItem | null {
  const props = file.appProperties;
  if (!props || props.pixelhb !== "artwork" || props.formatVersion !== FORMAT_VERSION) {
    return null;
  }
  const id = props.artworkId;
  const createdAt = parseCount(props.createdAt);
  const updatedAt = parseCount(props.updatedAt);
  const width = parseDimension(props.width);
  const height = parseDimension(props.height);
  if (
    typeof id !== "string" ||
    !ARTWORK_ID_PATTERN.test(id) ||
    createdAt === null ||
    updatedAt === null ||
    width === null ||
    height === null
  ) {
    return null;
  }
  const title = file.name.endsWith(JSON_SUFFIX) ? file.name.slice(0, -JSON_SUFFIX.length) : file.name;
  return {
    id,
    title: title.length > 0 ? title : id,
    width,
    height,
    createdAt,
    updatedAt,
    previewUrl: galleryPreviewUrl(id, updatedAt),
  };
}

export function createDriveArtworkStore(options: IDriveRestOptions): IDriveArtworkStore {
  const rest = createDriveRest(options);
  let rootFolder: Promise<string> | null = null;

  async function findOrCreateRootFolder(): Promise<string> {
    const [oldest] = await rest.listAll({ q: ROOT_QUERY, orderBy: "createdTime" });
    if (oldest) {
      return oldest.id;
    }
    const created = await rest.createFolder({
      name: site.name,
      mimeType: FOLDER_MIME,
      appProperties: { pixelhb: "root" },
    });
    return created.id;
  }

  function ensureRootFolder(): Promise<string> {
    if (!rootFolder) {
      const pending = findOrCreateRootFolder();
      rootFolder = pending;
      pending.catch(() => {
        if (rootFolder === pending) {
          rootFolder = null;
        }
      });
    }
    return rootFolder;
  }

  async function findArtworkFiles(id: string): Promise<IDriveArtworkFiles> {
    const files = await rest.listAll({ q: filesOfArtworkQuery(id) });
    return {
      json: files
        .filter((file) => file.appProperties?.pixelhb === "artwork")
        .sort((a, b) => updatedAtOf(b) - updatedAtOf(a)),
      png: files.filter((file) => file.appProperties?.pixelhb === "preview"),
    };
  }

  async function write(
    existing: IDriveFile | undefined,
    metadata: IDriveFileMetadata,
    createOnly: IDriveFileMetadata,
    content: Uint8Array,
    mimeType: string,
  ): Promise<void> {
    if (existing) {
      await rest.uploadExisting(existing.id, metadata, content, mimeType);
      return;
    }
    const parents = [await ensureRootFolder()];
    await rest.uploadNew({ ...metadata, ...createOnly, parents }, content, mimeType);
  }

  return {
    ensureRootFolder,

    async list() {
      const files = await rest.listAll({ q: LIST_QUERY });
      const newest = new Map<string, IGalleryListItem>();
      for (const file of files) {
        const item = toListItem(file);
        if (!item) {
          console.warn(`Skipping Drive file ${file.id}: unreadable PixelHB properties`);
          continue;
        }
        const current = newest.get(item.id);
        if (!current || item.updatedAt > current.updatedAt) {
          newest.set(item.id, item);
        }
      }
      return [...newest.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async get(id) {
      const { json } = await findArtworkFiles(id);
      return json[0] ? rest.download(json[0].id) : null;
    },

    async getPreview(id) {
      const { png } = await findArtworkFiles(id);
      return png[0] ? rest.download(png[0].id) : null;
    },

    async upsert(input: IDriveArtworkUpsert): Promise<TUpsertResult> {
      const { json, png } = await findArtworkFiles(input.id);
      const driveUpdatedAt = json[0] ? updatedAtOf(json[0]) : MISSING_UPDATED_AT;
      if (driveUpdatedAt > input.updatedAt) {
        return { kind: "conflict", updatedAt: driveUpdatedAt };
      }
      if (driveUpdatedAt === input.updatedAt) {
        return { kind: "saved", updatedAt: driveUpdatedAt };
      }

      const base = driveFileBaseName(input.title, input.id);
      await write(
        png[0],
        {
          name: driveFileName(base, PNG_SUFFIX),
          appProperties: { pixelhb: "preview", artworkId: input.id },
        },
        { mimeType: PNG_MIME },
        input.previewPng,
        PNG_MIME,
      );
      await write(
        json[0],
        {
          name: driveFileName(base, JSON_SUFFIX),
          appProperties: {
            pixelhb: "artwork",
            artworkId: input.id,
            updatedAt: String(input.updatedAt),
            createdAt: String(input.createdAt),
            width: String(input.width),
            height: String(input.height),
            formatVersion: FORMAT_VERSION,
          },
        },
        { mimeType: JSON_MIME },
        new TextEncoder().encode(input.artworkJson),
        JSON_MIME,
      );
      for (const extra of [...json.slice(1), ...png.slice(1)]) {
        await rest.trash(extra.id);
      }
      return { kind: "saved", updatedAt: input.updatedAt };
    },

    async trash(id, deletedAt): Promise<TTrashResult> {
      const { json, png } = await findArtworkFiles(id);
      if (json[0] && updatedAtOf(json[0]) > deletedAt) {
        return { kind: "conflict", updatedAt: updatedAtOf(json[0]) };
      }
      for (const file of [...json, ...png]) {
        await rest.trash(file.id);
      }
      return { kind: "trashed" };
    },
  };
}
