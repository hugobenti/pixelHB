/**
 * Purpose:
 * Sign-out sequence for a signed-in account: push what is pending, check what is still unsynced, ask
 * the user (Download them / Sign out anyway / Cancel) when anything is, then sign out and wipe this
 * account's local copies.
 *
 * Notes:
 * Nothing is deleted before the user confirmed. Auth.js signs out first: offline the HttpOnly session
 * cookie cannot be cleared, so a failure there keeps every local row. Only after it succeeds does the
 * flow stop the sync engine and wipe the rows and tombstones of that one owner, then reload so the
 * gallery restarts signed out. A failed download keeps the dialog open and deletes nothing.
 */
"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { shell } from "@/content/shell";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { exportArtworkAsJson } from "@/features/shared/artwork/artworkFileService";
import { listDeletions, listOwned, wipeOwner } from "@/features/shared/artwork/artworkSyncStore";
import type { IAccountState } from "@/features/shared/auth/auth.type";
import type { IConfirmDialogProps } from "@/features/shared/components/ConfirmDialog.type";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import { getSyncEngine } from "@/features/shared/sync/syncEngine";
import { decideSignOut, summarizeUnsynced } from "./logic/signOutDecision";
import type { IUnsyncedWork } from "./logic/signOutDecision.type";
import type { TSignOutPhase } from "./useSignOutFlow.type";

export const SIGN_OUT_FLUSH_TIMEOUT_MS = 10_000;
export const DOWNLOAD_GAP_MS = 300;

const copy = shell.account.signOutDialog;

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function readUnsynced(ownerId: string): Promise<IUnsyncedWork | null> {
  try {
    return summarizeUnsynced(await listOwned(ownerId), await listDeletions(ownerId));
  } catch {
    return null;
  }
}

export function useSignOutFlow(account: IAccountState): {
  start: () => void;
  busy: boolean;
  dialog: IConfirmDialogProps;
} {
  const { showToast } = useToast();
  const [phase, setPhase] = useState<TSignOutPhase>("idle");
  const [work, setWork] = useState<IUnsyncedWork | null>(null);
  const ownerId = account.status === "signedIn" ? (account.user?.id ?? null) : null;

  const finish = async (owner: string) => {
    setPhase("signingOut");
    try {
      await signOut({ redirect: false });
    } catch {
      showToast({ message: copy.failed, tone: "error" });
      setPhase("idle");
      return;
    }
    try {
      await getSyncEngine().stop();
      await wipeOwner(owner);
    } catch (error) {
      // The rows stay under this owner id, invisible when signed out, and return on the next sign-in.
      console.error("Couldn't remove this account's local copies", error);
    }
    artworkService.setActiveOwner(null);
    window.location.reload();
  };

  const start = () => {
    if (phase !== "idle" || ownerId === null) return;
    setPhase("checking");
    void (async () => {
      await getSyncEngine().flush(SIGN_OUT_FLUSH_TIMEOUT_MS);
      const unsynced = await readUnsynced(ownerId);
      if (decideSignOut(unsynced) === "signOutNow") {
        await finish(ownerId);
        return;
      }
      setWork(unsynced);
      setPhase("asking");
    })();
  };

  const download = () => {
    if (phase !== "asking" || !work) return;
    setPhase("downloading");
    void (async () => {
      try {
        for (const artwork of work.artworks) {
          exportArtworkAsJson(artwork);
          await pause(DOWNLOAD_GAP_MS);
        }
      } catch {
        showToast({ message: copy.downloadFailed, tone: "error" });
        setPhase("asking");
        return;
      }
      setPhase("downloaded");
    })();
  };

  const artworkCount = work?.artworks.length ?? 0;
  const dialog: IConfirmDialogProps = {
    options:
      (phase === "asking" || phase === "downloading") && work
        ? {
            title: copy.title,
            description: copy.description(artworkCount, work.deletionCount),
            confirmLabel: copy.signOutAnyway,
          }
        : phase === "downloaded"
          ? {
              title: copy.downloadedTitle,
              description: copy.downloadedDescription(artworkCount),
              confirmLabel: copy.signOut,
            }
          : null,
    onConfirm: () => {
      if ((phase === "asking" || phase === "downloaded") && ownerId !== null) void finish(ownerId);
    },
    onCancel: () => {
      if (phase === "asking" || phase === "downloaded") setPhase("idle");
    },
    extraAction:
      phase === "asking" && artworkCount > 0 ? { label: copy.download, onClick: download } : undefined,
  };

  return { start, busy: phase === "checking" || phase === "signingOut", dialog };
}
