/**
 * Purpose:
 * Whether this browser can run Drive sync: the engine and editor presence need Web Locks.
 *
 * Notes:
 * `navigator` is read at call time, never at module load, so the module is safe to import on the
 * server (where the answer is false).
 */

/** Without Web Locks the app behaves as if sync did not exist: no account control, local only. */
export function isSyncSupported(): boolean {
  return typeof navigator !== "undefined" && navigator !== null && "locks" in navigator;
}
