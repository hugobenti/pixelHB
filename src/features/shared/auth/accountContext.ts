/**
 * Purpose:
 * The React context that carries the account state from `AuthSessionProvider` to `useAccount`.
 */
import { createContext } from "react";

import type { IAccountState } from "./auth.type";
import { LOADING_ACCOUNT } from "./logic/accountSession";

/** Without a provider above, the account stays `loading` rather than guessing signed in or out. */
export const AccountContext = createContext<IAccountState>(LOADING_ACCOUNT);
