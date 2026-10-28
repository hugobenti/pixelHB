export type TSyncMessageKey =
  "thisBrowserOnly" | "syncing" | "saved" | "offline" | "signInAgain" | "tooLarge" | "unconfirmed";

export type TSyncTone = "neutral" | "progress" | "attention";

export interface ISyncStatusMessage {
  key: TSyncMessageKey;
  tone: TSyncTone;
  /** Too-large artworks for `tooLarge`, otherwise 0. */
  count: number;
  /** Whose drawings an `unconfirmed` message says are shown; empty when the name is unknown. */
  name?: string;
}

export interface ISyncMessageScope {
  artworkId: string;
}
