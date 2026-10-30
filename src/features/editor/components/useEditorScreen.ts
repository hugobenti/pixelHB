/**
 * Purpose:
 * EditorScreen behavior: loads the artwork by id into an editable copy, or reports that it is missing
 * or could not be read.
 */
"use client";

import { useEffect, useRef, useState } from "react";

import { editor } from "@/content/editor";
import { shouldReloadEditorArtwork } from "@/features/editor/logic/editorReload";
import type { IEditorLoaded } from "@/features/editor/logic/editorReload.type";
import { loadEditorArtwork } from "@/features/editor/logic/editorLoad";
import { capture } from "@/features/shared/analytics/analytics";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { useAccount } from "@/features/shared/auth/useAccount";
import { markArtworkOpen } from "@/features/shared/sync/openArtworkPresence";
import { EDITOR_REFRESH_TIMEOUT_MS, getSyncEngine } from "@/features/shared/sync/syncEngine";

export function useEditorScreen(artworkId: string) {
  const [artwork, setArtwork] = useState<IArtwork | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { status, user } = useAccount();
  const accountReady = status !== "loading";
  const signedIn = status === "signedIn";
  const ownerId = user?.id ?? null;
  /** What is on screen, so a provisional account confirmed by the server does not reload it. */
  const loadedRef = useRef<IEditorLoaded | null>(null);

  useEffect(() => {
    // A direct editor link must not read Dexie before the active owner is known.
    if (!accountReady) {
      return;
    }
    if (!shouldReloadEditorArtwork(loadedRef.current, { artworkId, signedIn, ownerId })) {
      // Same drawing, account now confirmed signed in: keep the editor, only take presence.
      const keep = markArtworkOpen(artworkId);
      loadedRef.current = { artworkId, signedIn, ownerId };
      return keep;
    }
    let cancelled = false;
    let release: (() => void) | undefined;
    void (async () => {
      if (signedIn) {
        // Refresh first, then take presence: the refresh only needs to defer for other tabs.
        await getSyncEngine().refreshOne(artworkId, EDITOR_REFRESH_TIMEOUT_MS);
        if (cancelled) {
          return;
        }
        release = markArtworkOpen(artworkId);
      }
      const result = await loadEditorArtwork(artworkId, artworkService.getArtwork);
      if (cancelled) {
        return;
      }
      if (result.status === "ready") {
        setLoadError(null);
        setArtwork(result.artwork);
        loadedRef.current = { artworkId, signedIn, ownerId };
        capture("artwork_opened");
        return;
      }
      loadedRef.current = null;
      setArtwork(null);
      setLoadError(
        result.status === "notFound" ? editor.screen.notFound : editor.screen.loadFailed,
      );
    })();
    return () => {
      cancelled = true;
      release?.();
    };
  }, [artworkId, accountReady, signedIn, ownerId]);

  return { artwork, loadError };
}
