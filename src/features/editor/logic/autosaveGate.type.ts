export interface IAutosaveRevisions {
  paintRevision: number;
  historyRevision: number;
}

export interface IAutosaveGate {
  observe(revisions: IAutosaveRevisions): void;
  /** True once per unsaved edit, then false until the next edit. */
  takePending(): boolean;
  /** Re-arms the edit just taken (its save failed) so the next flush retries. */
  markPending(): void;
}
