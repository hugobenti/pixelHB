import type { IAccountHint, IAccountState } from "../auth.type";

/** Everything the controller touches outside itself, so tests can drive it without a browser. */
export interface IAccountSessionControllerDeps {
  fetchFn: typeof fetch;
  readHint: () => IAccountHint | null;
  writeHint: (hint: IAccountHint) => void;
  clearHint: () => void;
  isOnline: () => boolean;
  setTimer: (callback: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  /** Called with every new account state (never with an unchanged one). */
  onState: (state: IAccountState) => void;
}

export interface IAccountSessionController {
  /** Asks the server now; resolves when this and any request queued behind it have finished. */
  refresh: () => Promise<void>;
  /** The browser came back online: forgets the backoff and asks now. */
  online: () => Promise<void>;
  /** The periodic check: skipped while offline or definitively signed out. */
  poll: () => Promise<void>;
  /** Stops timers and ignores in-flight answers. */
  dispose: () => void;
}
