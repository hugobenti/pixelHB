/**
 * Purpose:
 * Provides the account state when Drive sync is on; with the flag off it renders only its
 * children, so no `/api/auth/session` request is ever made.
 *
 * Notes:
 * Hooks called in the body of the component that renders this provider are outside it.
 */
"use client";

import { AccountContext } from "./accountContext";
import type { IAuthSessionProviderProps } from "./auth.type";
import { DRIVE_SYNC_ENABLED } from "./driveSyncFlag";
import { useAccountSession } from "./useAccountSession";

function AccountSessionProvider({ children }: IAuthSessionProviderProps) {
  const account = useAccountSession();
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}

export function AuthSessionProvider({ children }: IAuthSessionProviderProps) {
  return DRIVE_SYNC_ENABLED ? (
    <AccountSessionProvider>{children}</AccountSessionProvider>
  ) : (
    <>{children}</>
  );
}
