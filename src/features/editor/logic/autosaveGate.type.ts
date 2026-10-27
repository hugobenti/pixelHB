export interface IAutosaveRevisions {
  paintRevision: number;
  historyRevision: number;
}

export interface IAutosaveGate {
  observe(revisions: IAutosaveRevisions): void;
  /** True once per unsaved edit, then false until the next edit. */
  takePending(): boolean;
}
