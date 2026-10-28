/**
 * Purpose:
 * Decides whether the editor screen reads its artwork again when the account changes.
 *
 * Notes:
 * The one case that must not reload is a loaded artwork whose account goes from signed out to
 * signed in (a provisional guess confirmed by the server): the sync engine's adoption of
 * signed-out drawings is still running then, so a fresh read under the new owner could miss the
 * row and replace a live editor with "not found". Another artwork, signing out and a different
 * signed-in owner reload; an unchanged account does not.
 */
import type { IEditorLoaded, TEditorLoadTarget } from "./editorReload.type";

export function shouldReloadEditorArtwork(
  loaded: IEditorLoaded | null,
  next: TEditorLoadTarget,
): boolean {
  if (loaded === null) return true;
  if (loaded.artworkId !== next.artworkId) return true;
  if (!loaded.signedIn && next.signedIn) return false;
  return loaded.signedIn !== next.signedIn || loaded.ownerId !== next.ownerId;
}
