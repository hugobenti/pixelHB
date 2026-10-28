export interface ISignOutDeps {
  /** Auth.js sign-out without redirect; resolves with whatever Auth.js answered. */
  signOut: () => Promise<unknown>;
  /** True only when the session really ended, given what `signOut` resolved with. */
  verifySignedOut: (result: unknown) => Promise<boolean>;
  /** Durable note that this owner's local copies still have to be removed; may be a no-op. */
  writeMarker: (ownerId: string) => void;
  stopEngine: () => Promise<void>;
  wipeOwner: (ownerId: string) => Promise<void>;
  clearMarker: () => void;
  setActiveOwner: (ownerId: string | null) => void;
}

/** `signOutFailed`: still signed in, nothing touched. `wipeFailed`: signed out, marker kept for a retry. */
export type TSignOutOutcome = "done" | "signOutFailed" | "wipeFailed";
