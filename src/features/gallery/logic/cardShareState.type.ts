export type TCardShareState = "preparing" | "ready" | "failed";

export interface ICardShareInputs {
  /** A PNG for the current inputs is ready. */
  rendered: boolean;
  /** Loading the artwork or rendering it failed. */
  failed: boolean;
}
