/**
 * Purpose:
 * Decides whether the editor screen reads its artwork again when the account changes.
 *
 * Notes:
 * The one case that must not reload is a loaded artwork whose account goes from signed out to
 * signed in (a provisional guess confirmed by the server): the sync engine's adoption of
 * signed-out drawings is still running then, so a fresh read under the new owner could miss the
 * row and replace a live editor with "not found". Every other change (another artwork, another
 * owner, signing out) reloads.
 */
import type { IEditorLoaded, IEditorLoadTarget } from "./editorReload.type";

export function shouldReloadEditorArtwork(
  loaded: IEditorLoaded | null,
  next: IEditorLoadTarget,
): boolean {
  if (loaded === null) return true;
  if (loaded.artworkId !== next.artworkId) return true;
  return !(!loaded.signedIn && next.signedIn);
}
