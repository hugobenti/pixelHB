import type { IGalleryListResponse, IGalleryStatusResponse } from "../galleryApi.type";
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
  list(): Promise<IGalleryListResponse>;
  /** Raw Drive bytes of the newest artwork JSON; `null` when Drive has none. */
  get(id: string): Promise<ReadableStream<Uint8Array> | null>;
  getPreview(id: string): Promise<ReadableStream<Uint8Array> | null>;
  /** Where the artwork is in Drive: live (even unreadable), trashed with a readable stamp, or nowhere. */
  status(id: string): Promise<IGalleryStatusResponse>;
  /** The newest trashed copy of the artwork JSON with a readable `updatedAt`; `null` when there is none. */
  findTrashed(id: string): Promise<{ updatedAt: number } | null>;
  upsert(input: IDriveArtworkUpsert): Promise<TUpsertResult>;
  trash(id: string, deletedAt: number): Promise<TTrashResult>;
}

export interface IDriveArtworkFiles {
  /** Artwork JSON files, newest `updatedAt` first; files with an unreadable `updatedAt` last. */
  json: IDriveFile[];
  png: IDriveFile[];
}
