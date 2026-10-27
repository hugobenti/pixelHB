/**
 * Purpose:
 * The sync status message for the current account, read through a selector so a component only
 * re-renders when the message itself changes.
 */
"use client";

import { useShallow } from "zustand/react/shallow";

import { useAccount } from "@/features/shared/auth/useAccount";
import { syncStatusMessage } from "./logic/syncStatusMessage";
import type { ISyncMessageScope, ISyncStatusMessage } from "./logic/syncStatusMessage.type";
import { useSyncStore } from "./useSyncStore";

export function useSyncMessage(scope?: ISyncMessageScope): ISyncStatusMessage | null {
  const account = useAccount();
  return useSyncStore(useShallow((state) => syncStatusMessage(account, state, scope)));
}
