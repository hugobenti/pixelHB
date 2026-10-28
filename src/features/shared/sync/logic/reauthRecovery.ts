/**
 * Purpose:
 * Decides when to ask the engine for a full pass because the account stopped needing a new sign-in.
 *
 * Notes:
 * The engine cancels its retries when Drive access needs reauth, and nothing restarts it by itself.
 * When another tab signs in again, this tab's session reports `needsReauth: false` and this is the
 * trigger. The first value seen is never a recovery.
 */
export function shouldResyncAfterReauth(previous: boolean | undefined, current: boolean): boolean {
  return previous === true && !current;
}
