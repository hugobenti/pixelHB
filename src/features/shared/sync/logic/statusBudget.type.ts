export interface IStatusCandidate {
  id: string;
  updatedAt: number;
}

export interface IStatusPlan {
  /** Answered `absent` recently: counted as missing without asking again. */
  remembered: string[];
  /** Ask Drive now, newest first. */
  check: string[];
  /** Due but over the per-pass budget: left for a later pass. */
  leftOver: number;
}
