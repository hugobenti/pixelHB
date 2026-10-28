/**
 * Purpose:
 * The signed-in account as the UI sees it: `disabled` when Drive sync is off, otherwise the account
 * state `AuthSessionProvider` keeps (see `useAccountSession`).
 *
 * Notes:
 * The variant is chosen once at module level, so the context is only read where
 * `AuthSessionProvider` mounted a value (with the flag off nothing is fetched at all).
 */
"use client";

import { useContext } from "react";

import { AccountContext } from "./accountContext";
import type { IAccountState } from "./auth.type";
import { DRIVE_SYNC_ENABLED } from "./driveSyncFlag";

const DISABLED_ACCOUNT: IAccountState = { status: "disabled", user: null, needsReauth: false };

function useAccountEnabled(): IAccountState {
  return useContext(AccountContext);
}

function useAccountDisabled(): IAccountState {
  return DISABLED_ACCOUNT;
}

export const useAccount: () => IAccountState = DRIVE_SYNC_ENABLED
  ? useAccountEnabled
  : useAccountDisabled;
