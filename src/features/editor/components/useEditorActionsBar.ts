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
import { syncStatusText } from "@/features/shared/sync/logic/syncStatusMessage";
import { useSyncMessage } from "@/features/shared/sync/useSyncMessage";
import type { IEditorActionsBarProps } from "./EditorActionsBar.type";

export function useEditorActionsBar({ activeSlot, artworkId }: IEditorActionsBarProps) {
  const slotLabel = editor.toolbar.slot[activeSlot];
  const account = useAccount();
  const syncMessage = useSyncMessage({ artworkId });
  const message = account.status === "signedIn" ? syncMessage : null;

  return {
    slotLabel,
    slotAriaLabel: editor.toolbar.slot.label(slotLabel),
    syncStatus: message ? { text: syncStatusText(message), tone: message.tone } : null,
  };
}
