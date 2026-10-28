export interface IRemovalBrakeInput {
  /** Synced rows the plan would remove (open artworks excluded: they are deferred, not removed). */
  removalCount: number;
  /** All synced rows of the owner. */
  syncedCount: number;
  /** Drive listed no artwork at all, readable or not. */
  remoteListEmpty: boolean;
}
