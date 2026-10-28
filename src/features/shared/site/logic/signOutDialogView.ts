/**
 * Purpose:
 * Maps the sign-out flow's phase and unsynced summary to the dialog step it shows.
 *
 * Notes:
 * Pure. An unreadable local database (`work === null` while asking) has its own step so the user
 * can still choose; `downloading` keeps the unsynced step on screen with every button disabled.
 */
import type { TSignOutPhase } from "../useSignOutFlow.type";
import type { IUnsyncedWork } from "./signOutDecision.type";
import type { ISignOutDialogView } from "./signOutDialogView.type";

export function signOutDialogView(
  phase: TSignOutPhase,
  work: IUnsyncedWork | null,
): ISignOutDialogView {
  switch (phase) {
    case "asking":
    case "downloading":
      return work
        ? { step: "unsynced", canDownload: work.artworks.length > 0, busy: phase === "downloading" }
        : { step: "unreadable", canDownload: false, busy: false };
    case "downloaded":
      return { step: "downloaded", canDownload: false, busy: false };
    default:
      return { step: "closed", canDownload: false, busy: false };
  }
}
