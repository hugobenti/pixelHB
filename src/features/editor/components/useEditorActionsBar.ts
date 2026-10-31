/**
 * Purpose:
 * EditorActionsBar view model: the sync status of the open artwork.
 *
 * Notes:
 * The status only exists for a signed-in user.
 */
"use client";

import { useAccount } from "@/features/shared/auth/useAccount";
import { syncStatusText } from "@/features/shared/sync/logic/syncStatusMessage";
import { useSyncMessage } from "@/features/shared/sync/useSyncMessage";
import type { IEditorActionsBarProps } from "./EditorActionsBar.type";

export function useEditorActionsBar({ artworkId }: IEditorActionsBarProps) {
  const account = useAccount();
  const syncMessage = useSyncMessage({ artworkId });
  const message = account.status === "signedIn" ? syncMessage : null;

  return {
    syncStatus: message ? { text: syncStatusText(message), tone: message.tone } : null,
  };
}
