/**
 * Purpose:
 * The destructive part of signing out, in a fixed order: end the Auth.js session, prove it ended,
 * record that this owner's rows are owed a wipe, stop the engine, wipe, forget the record.
 *
 * Notes:
 * Nothing is deleted unless the sign-out was verified, so a failed or fake sign-out never costs
 * local art. The marker is written before the engine stops and cleared only after the wipe
 * succeeded, so a crash or a failing wipe leaves a record the next start can finish.
 */
import type { ISignOutDeps, TSignOutOutcome } from "./signOutRun.type";

export async function runSignOut(ownerId: string, deps: ISignOutDeps): Promise<TSignOutOutcome> {
  try {
    const result = await deps.signOut();
    if (!(await deps.verifySignedOut(result))) return "signOutFailed";
  } catch {
    return "signOutFailed";
  }

  deps.clearAccountHint();
  deps.writeMarker(ownerId);
  deps.setActiveOwner(null);
  try {
    await deps.stopEngine();
    await deps.wipeOwner(ownerId);
  } catch {
    return "wipeFailed";
  }
  deps.clearMarker();
  return "done";
}
