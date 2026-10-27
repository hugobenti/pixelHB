export type TSignOutDialogStep = "closed" | "unsynced" | "unreadable" | "downloaded";

export interface ISignOutDialogView {
  step: TSignOutDialogStep;
  /** The Download button is mounted (artworks to export), possibly disabled. */
  canDownload: boolean;
  /** A download is running: all buttons disabled. */
  busy: boolean;
}
