/**
 * Purpose:
 * The browser's sync engine singleton, wired to fetch, Dexie, Web Locks and the window events, plus
 * the capability check the editor and the engine's hook use.
 */
import * as artworkService from "@/features/shared/artwork/artworkService";
import * as artworkSyncStore from "@/features/shared/artwork/artworkSyncStore";
import { artworkToPngThumbnail } from "@/features/shared/artwork/thumbnail";
import { DRIVE_SYNC_ENABLED } from "@/features/shared/auth/driveSyncFlag";
import { createGalleryApiClient } from "@/features/shared/drive/galleryApiClient";
import { createSyncEngine } from "./createSyncEngine";
import { createLocksPresence } from "./openArtworkPresence";
import type { ISyncEngine } from "./sync.type";
import { useSyncStore } from "./useSyncStore";

export const EDITOR_REFRESH_TIMEOUT_MS = 3_000;

/** Drive sync needs the flag and Web Locks; without either the app behaves as if sync did not exist. */
export function isDriveSyncSupported(): boolean {
  return DRIVE_SYNC_ENABLED && typeof navigator !== "undefined" && "locks" in navigator;
}

let engine: ISyncEngine | null = null;

export function getSyncEngine(): ISyncEngine {
  engine ??= createSyncEngine({
    api: createGalleryApiClient((input, init) => fetch(input, init)),
    store: artworkSyncStore,
    presence: createLocksPresence(),
    environment: {
      isOnline: () => navigator.onLine,
      onOnline: (listener) => {
        window.addEventListener("online", listener);
        return () => window.removeEventListener("online", listener);
      },
      onHidden: (listener) => {
        const onChange = () => {
          if (document.visibilityState === "hidden") listener();
        };
        document.addEventListener("visibilitychange", onChange);
        return () => document.removeEventListener("visibilitychange", onChange);
      },
    },
    timers: {
      after: (ms, callback) => {
        const handle = setTimeout(callback, ms);
        return () => clearTimeout(handle);
      },
    },
    now: Date.now,
    setStatus: (patch) => useSyncStore.getState().setStatus(patch),
    onArtworkChanged: artworkService.onArtworkChanged,
    renderThumbnail: artworkToPngThumbnail,
    warn: (message, id) => console.warn(message, id),
  });
  return engine;
}
