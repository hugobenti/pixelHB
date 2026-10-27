/**
 * Purpose:
 * The signed-in account as the UI sees it: `disabled` when Drive sync is off, otherwise the Auth.js
 * session mapped to `IAccountState`.
 *
 * Notes:
 * The variant is chosen once at module level, so `useSession` is never called without a
 * `SessionProvider` (`next-auth/react` throws in development without one).
 */
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import type { IAccountState } from "./auth.type";
import { DRIVE_SYNC_ENABLED } from "./driveSyncFlag";
import { toAccountState } from "./logic/publicSession";

const DISABLED_ACCOUNT: IAccountState = { status: "disabled", user: null, needsReauth: false };

function useAccountEnabled(): IAccountState {
  const { data, status } = useSession();
  return useMemo(() => toAccountState(data, status), [data, status]);
}

function useAccountDisabled(): IAccountState {
  return DISABLED_ACCOUNT;
}

export const useAccount: () => IAccountState = DRIVE_SYNC_ENABLED
  ? useAccountEnabled
  : useAccountDisabled;
