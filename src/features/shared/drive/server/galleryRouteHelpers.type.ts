import type { IDriveArtworkUpsert } from "./driveArtworkStore.type";

export interface ISaveBodyLimits {
  /** Cap on the request body as sent (gzip-compressed). */
  maxCompressedBytes: number;
  /** Cap on the body after gunzip; stops gzip bombs. */
  maxInflatedBytes: number;
}

export type TRequestRejection = {
  ok: false;
  status: 400 | 403 | 413 | 415;
  code: "bad_request" | "too_large" | "clock_skew" | "forbidden" | "unsupported_media_type";
};

export type TSaveRequestResult = { ok: true; upsert: IDriveArtworkUpsert } | TRequestRejection;

export type TDeleteRequestResult = { ok: true; deletedAt: number } | TRequestRejection;

/** Outcome of reading a capped byte stream: the bytes, or `null` when the cap was exceeded. */
export type TCappedBytes = Uint8Array | null;
