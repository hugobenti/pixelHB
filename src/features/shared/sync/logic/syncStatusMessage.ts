/**
 * Purpose:
 * Maps the account and the sync engine status to the one message every surface shows (gallery note,
 * editor bar, account panel), and looks its copy up.
 *
 * Notes:
 * Order: unconfirmed (provisional account), reauth, Drive full, clock skew, offline, syncing, too large, kept
 * removals, saved. Engine phase `error` reads as offline (Drive could not be reached and the local copy is
 * what is shown) unless a more specific cause is known (full Drive, wrong clock); phase `disabled` while signed in means
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
  unconfirmed: "neutral",
  driveFull: "attention",
  clockSkew: "attention",
  removalsKept: "attention",
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
  if (account.provisional) {
    return { ...message("unconfirmed"), name: account.user?.name };
  }
  if (account.needsReauth || status.phase === "reauth") return message("signInAgain");
  if (status.phase === "disabled") return message("thisBrowserOnly");
  if (status.driveFull) return message("driveFull");
  const skewed = scope
    ? status.clockSkewIds.filter((id) => id === scope.artworkId)
    : status.clockSkewIds;
  if (skewed.length > 0) return message("clockSkew", skewed.length);
  if (status.phase === "offline" || status.phase === "error") return message("offline");
  if (status.phase === "syncing" || status.pendingCount > status.tooLargeIds.length) {
    return message("syncing");
  }
  const tooLarge = scope
    ? status.tooLargeIds.filter((id) => id === scope.artworkId)
    : status.tooLargeIds;
  if (tooLarge.length > 0) return message("tooLarge", tooLarge.length);
  if (!scope && status.suspendedRemovals > 0) return message("removalsKept", status.suspendedRemovals);
  return message("saved");
}

export function syncStatusText(status: ISyncStatusMessage): string {
  if (status.key === "tooLarge") return shared.sync.tooLarge(status.count);
  if (status.key === "unconfirmed") return shared.sync.unconfirmed(status.name);
  if (status.key === "clockSkew") return shared.sync.clockSkew(status.count);
  if (status.key === "removalsKept") return shared.sync.removalsKept(status.count);
  return shared.sync[status.key];
}
