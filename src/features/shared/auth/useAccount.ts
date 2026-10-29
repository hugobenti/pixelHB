/**
 * Purpose:
 * The signed-in account as the UI sees it: the account state `AuthSessionProvider` keeps (see
 * `useAccountSession`).
 */
"use client";

import { useContext } from "react";

import { AccountContext } from "./accountContext";
import type { IAccountState } from "./auth.type";

export function useAccount(): IAccountState {
  return useContext(AccountContext);
}
