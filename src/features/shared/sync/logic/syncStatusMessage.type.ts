export type TSyncMessageKey =
  | "thisBrowserOnly"
  | "syncing"
  | "saved"
  | "offline"
  | "signInAgain"
  | "tooLarge"
  | "unconfirmed"
  | "driveFull"
  | "clockSkew"
  | "removalsKept";

export type TSyncTone = "neutral" | "progress" | "attention";

export interface ISyncStatusMessage {
  key: TSyncMessageKey;
  tone: TSyncTone;
  /** Artworks the message is about for `tooLarge`, `clockSkew` and `removalsKept`, otherwise 0. */
  count: number;
  /** Whose drawings an `unconfirmed` message says are shown; empty when the name is unknown. */
  name?: string;
}

export interface ISyncMessageScope {
  artworkId: string;
}
