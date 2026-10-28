export interface IRemovalBrakeInput {
  /** Synced rows the plan would remove (open artworks excluded: they are deferred, not removed). */
  removalCount: number;
  /** The PixelHB folder is in the Drive trash and no live one exists. */
  rootFolderTrashed: boolean;
}

export type TRemovalBrake = "folderTrashed";
