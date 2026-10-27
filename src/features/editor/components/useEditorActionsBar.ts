/**
 * Purpose:
 * EditorActionsBar view model: the active painting slot's name, the slot toggle's accessible name and
 * the sync status of the open artwork.
 *
 * Notes:
 * The status only exists for a signed-in user.
 */
"use client";

import { editor } from "@/content/editor";
import { useAccount } from "@/features/shared/auth/useAccount";
import { syncStatusMessage, syncStatusText } from "@/features/shared/sync/logic/syncStatusMessage";
import { useSyncStatus } from "@/features/shared/sync/useSyncStore";
import type { IEditorActionsBarProps } from "./EditorActionsBar.type";

export function useEditorActionsBar({ activeSlot, artworkId }: IEditorActionsBarProps) {
  const slotLabel = editor.toolbar.slot[activeSlot];
  const account = useAccount();
  const status = useSyncStatus();
  const message =
    account.status === "signedIn" ? syncStatusMessage(account, status, { artworkId }) : null;

  return {
    slotLabel,
    slotAriaLabel: editor.toolbar.slot.label(slotLabel),
    syncStatus: message ? { text: syncStatusText(message), tone: message.tone } : null,
  };
}
