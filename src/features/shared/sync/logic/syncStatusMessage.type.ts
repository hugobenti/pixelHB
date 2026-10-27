export type TSyncMessageKey =
  "thisBrowserOnly" | "syncing" | "saved" | "offline" | "signInAgain" | "tooLarge";

export type TSyncTone = "neutral" | "progress" | "attention";

export interface ISyncStatusMessage {
  key: TSyncMessageKey;
  tone: TSyncTone;
  /** Too-large artworks for `tooLarge`, otherwise 0. */
  count: number;
}

export interface ISyncMessageScope {
  artworkId: string;
}
