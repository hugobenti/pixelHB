/**
 * Purpose:
 * Maps the account and the sync engine status to the one message every surface shows (gallery note,
 * editor bar, account panel), and looks its copy up.
 *
 * Notes:
 * Order: reauth, offline, syncing, too large, saved. Engine phase `error` reads as offline (Drive
 * could not be reached and the local copy is what is shown); phase `disabled` while signed in means
 * the engine is not running (e.g. no Web Locks), so work stays in this browser. Idle with more pending changes than too-large ones means a push is still
 * debounced, so it is not "saved" yet. `null` while the account is loading.
 */
import { shared } from "@/content/shared";
import type { IAccountState } from "@/features/shared/auth/auth.type";
import type { ISyncStatus } from "@/features/shared/sync/sync.type";
import type {
  ISyncMessageScope,
  ISyncStatusMessage,
  TSyncMessageKey,
  TSyncTone,
} from "./syncStatusMessage.type";

const TONES: Record<TSyncMessageKey, TSyncTone> = {
  thisBrowserOnly: "neutral",
  saved: "neutral",
  syncing: "progress",
  offline: "attention",
  signInAgain: "attention",
  tooLarge: "attention",
};

function message(key: TSyncMessageKey, count = 0): ISyncStatusMessage {
  return { key, tone: TONES[key], count };
}

export function syncStatusMessage(
  account: IAccountState,
  status: ISyncStatus,
  scope?: ISyncMessageScope,
): ISyncStatusMessage | null {
  if (account.status === "loading") return null;
  if (account.status !== "signedIn") return message("thisBrowserOnly");
  if (account.needsReauth || status.phase === "reauth") return message("signInAgain");
  if (status.phase === "disabled") return message("thisBrowserOnly");
  if (status.phase === "offline" || status.phase === "error") return message("offline");
  if (status.phase === "syncing" || status.pendingCount > status.tooLargeIds.length) {
    return message("syncing");
  }
  const tooLarge = scope
    ? status.tooLargeIds.filter((id) => id === scope.artworkId)
    : status.tooLargeIds;
  return tooLarge.length > 0 ? message("tooLarge", tooLarge.length) : message("saved");
}

export function syncStatusText(status: ISyncStatusMessage): string {
  return status.key === "tooLarge" ? shared.sync.tooLarge(status.count) : shared.sync[status.key];
}
