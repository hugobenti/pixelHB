import type { IGalleryListItem } from "../galleryApi.type";
import type { IDriveFile } from "./driveRest.type";

export interface IDriveArtworkUpsert {
  id: string;
  title: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  /** Compact JSON of the v3 artwork file, stored as-is. */
  artworkJson: string;
  previewPng: Uint8Array;
}

export type TUpsertResult =
  | { kind: "saved"; updatedAt: number }
  | { kind: "conflict"; updatedAt: number };

export type TTrashResult = { kind: "trashed" } | { kind: "conflict"; updatedAt: number };

export interface IDriveArtworkStore {
  ensureRootFolder(): Promise<string>;
  list(): Promise<IGalleryListItem[]>;
  /** Raw Drive bytes of the newest artwork JSON; `null` when Drive has none. */
  get(id: string): Promise<ReadableStream<Uint8Array> | null>;
  getPreview(id: string): Promise<ReadableStream<Uint8Array> | null>;
  upsert(input: IDriveArtworkUpsert): Promise<TUpsertResult>;
  trash(id: string, deletedAt: number): Promise<TTrashResult>;
}

export interface IDriveArtworkFiles {
  /** Artwork JSON files, newest `updatedAt` first; files with an unreadable `updatedAt` last. */
  json: IDriveFile[];
  png: IDriveFile[];
}
