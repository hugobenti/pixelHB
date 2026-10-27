/**
 * Purpose:
 * Change-gated, debounced IndexedDB persistence for the open artwork, flushed when the page is
 * hidden or closed (`pagehide`, `visibilitychange`) and on editor unmount.
 *
 * Notes:
 * Only a real edit (paint or history revision moved since mount or the last save) is written, so
 * opening and leaving an artwork never touches `updatedAt`; a failed save re-arms the gate.
 * Shares one implementation path for thumbnail encoding and artworkService.saveArtwork (DRY).
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import * as artworkService from "@/features/shared/artwork/artworkService";
import { createAutosaveGate } from "@/features/editor/logic/autosaveGate";
import { artworkToPngThumbnail } from "@/features/shared/artwork/thumbnail";
import type { IUseEditorAutosaveParams } from "./useEditorAutosave.type";

const AUTOSAVE_DEBOUNCE_MS = 650;

export function useEditorAutosave({
  artworkRef,
  artworkId,
  paintRevision,
  historyRevision,
}: IUseEditorAutosaveParams) {
  const [gate] = useState(() => createAutosaveGate({ paintRevision, historyRevision }));

  const persistIfEdited = useCallback(() => {
    if (!gate.takePending()) {
      return;
    }
    const current = artworkRef.current;
    if (!current || typeof document === "undefined") {
      return;
    }
    const thumb = artworkToPngThumbnail(current);
    artworkService
      .saveArtwork({
        ...current,
        thumbnail: thumb || current.thumbnail,
      })
      .catch(() => gate.markPending());
  }, [artworkRef, gate]);

  useEffect(() => {
    gate.observe({ paintRevision, historyRevision });
    const handle = window.setTimeout(persistIfEdited, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [artworkId, paintRevision, historyRevision, gate, persistIfEdited]);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        persistIfEdited();
      }
    };
    window.addEventListener("pagehide", persistIfEdited);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", persistIfEdited);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      persistIfEdited();
    };
  }, [persistIfEdited]);
}
