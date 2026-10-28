/**
 * Purpose:
 * Sign-out sequence for a signed-in account: push what is pending, check what is still unsynced, ask
 * the user (Download them / Sign out anyway / Cancel) when anything is, then sign out and wipe this
 * account's local copies.
 *
 * Notes:
 * Nothing is deleted before the user confirmed. The destructive order lives in `runSignOut`: Auth.js
 * signs out first and is verified (offline the HttpOnly cookie cannot be cleared), then a durable
 * wipe marker is written, the engine stops and only that owner's rows and tombstones are wiped. A
 * failed download keeps the dialog open and deletes nothing. While files download the dialog is
 * disabled, not dead: Cancel works again once the last file was triggered.
 */
"use client";

import { getSession, signOut } from "next-auth/react";
import { useState } from "react";

import { shell } from "@/content/shell";
import * as artworkService from "@/features/shared/artwork/artworkService";
import { exportArtworkAsJson } from "@/features/shared/artwork/artworkFileService";
import { listDeletions, listOwned, wipeOwner } from "@/features/shared/artwork/artworkSyncStore";
import type { IAccountState } from "@/features/shared/auth/auth.type";
import { verifySignOutResult } from "@/features/shared/auth/logic/signOutResult";
import { runSignOut } from "@/features/shared/auth/logic/signOutRun";
import { clearAccountHint } from "@/features/shared/auth/accountHintStore";
import { clearPendingWipe, writePendingWipe } from "@/features/shared/auth/pendingWipeMarker";
import type { IConfirmDialogProps } from "@/features/shared/components/ConfirmDialog.type";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import { getSyncEngine } from "@/features/shared/sync/syncEngine";
import { decideSignOut, summarizeUnsynced } from "./logic/signOutDecision";
import type { IUnsyncedWork } from "./logic/signOutDecision.type";
import { signOutDialogView } from "./logic/signOutDialogView";
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
  /** A provisional account is a guess, never a reason to sign out or wipe anything. */
  const ownerId =
    account.status === "signedIn" && !account.provisional ? (account.user?.id ?? null) : null;

  const finish = async (owner: string) => {
    setPhase("signingOut");
    const outcome = await runSignOut(owner, {
      signOut: () => signOut({ redirect: false }),
      verifySignedOut: async (result) =>
        verifySignOutResult(result) === "ok" && (await getSession({ broadcast: false })) === null,
      writeMarker: writePendingWipe,
      stopEngine: () => getSyncEngine().stop(),
      wipeOwner,
      clearMarker: clearPendingWipe,
      clearAccountHint,
      setActiveOwner: artworkService.setActiveOwner,
    });
    if (outcome === "signOutFailed") {
      showToast({ message: copy.failed, tone: "error" });
      setPhase("idle");
      return;
    }
    if (outcome === "wipeFailed") {
      // Signed out, but the copies are still here: the marker finishes the wipe on the next start.
      showToast({ message: copy.wipeFailed, tone: "error" });
      setPhase("idle");
      return;
    }
    window.location.reload();
  };

  const start = () => {
    if (phase !== "idle" || ownerId === null) return;
    setPhase("checking");
    void (async () => {
      let unsynced: IUnsyncedWork | null = null;
      try {
        await getSyncEngine().flush(SIGN_OUT_FLUSH_TIMEOUT_MS);
        unsynced = await readUnsynced(ownerId);
      } catch {
        unsynced = null;
      }
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

  const view = signOutDialogView(phase, work);
  const artworkCount = work?.artworks.length ?? 0;
  const options: IConfirmDialogProps["options"] =
    view.step === "unsynced" && work
      ? {
          title: copy.title,
          description: copy.description(artworkCount, work.deletionCount),
          confirmLabel: copy.signOutAnyway,
        }
      : view.step === "unreadable"
        ? {
            title: copy.unreadableTitle,
            description: copy.unreadableDescription,
            confirmLabel: copy.signOutAnyway,
          }
        : view.step === "downloaded"
          ? {
              title: copy.downloadedTitle,
              description: copy.downloadedDescription(artworkCount),
              confirmLabel: copy.signOut,
            }
          : null;

  const dialog: IConfirmDialogProps = {
    options,
    busy: view.busy,
    onConfirm: () => {
      if ((phase === "asking" || phase === "downloaded") && ownerId !== null) void finish(ownerId);
    },
    onCancel: () => {
      if (phase === "asking" || phase === "downloaded") setPhase("idle");
    },
    extraAction: view.canDownload ? { label: copy.download, onClick: download } : undefined,
  };

  return { start, busy: phase === "checking" || phase === "signingOut", dialog };
}
