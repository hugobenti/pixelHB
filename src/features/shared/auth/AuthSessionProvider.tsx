/**
 * Purpose:
 * Provides the account state (`useAccountSession`) to everything below it.
 *
 * Notes:
 * Hooks called in the body of the component that renders this provider are outside it.
 */
"use client";

import { AccountContext } from "./accountContext";
import type { IAuthSessionProviderProps } from "./auth.type";
import { useAccountSession } from "./useAccountSession";

export function AuthSessionProvider({ children }: IAuthSessionProviderProps) {
  const account = useAccountSession();
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}
