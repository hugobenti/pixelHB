/**
 * Purpose:
 * EditorScreen behavior: loads the artwork by id into an editable copy, or reports that it is missing
 * or could not be read.
 */
"use client";

import { useEffect, useState } from "react";

import { editor } from "@/content/editor";
import { loadEditorArtwork } from "@/features/editor/logic/editorLoad";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { useAccount } from "@/features/shared/auth/useAccount";
import { markArtworkOpen } from "@/features/shared/sync/openArtworkPresence";
import { EDITOR_REFRESH_TIMEOUT_MS, getSyncEngine } from "@/features/shared/sync/syncEngine";

export function useEditorScreen(artworkId: string) {
  const [artwork, setArtwork] = useState<IArtwork | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { status } = useAccount();
  const accountReady = status !== "loading";
  const signedIn = status === "signedIn";

  useEffect(() => {
    // A direct editor link must not read Dexie before the active owner is known.
    if (!accountReady) {
      return;
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
        return;
      }
      setArtwork(null);
      setLoadError(
        result.status === "notFound" ? editor.screen.notFound : editor.screen.loadFailed,
      );
    })();
    return () => {
      cancelled = true;
      release?.();
    };
  }, [artworkId, accountReady, signedIn]);

  return { artwork, loadError };
}
