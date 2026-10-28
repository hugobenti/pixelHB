/**
 * Purpose:
 * The account-state machine behind `useAccountSession`, free of React and of browser globals: one
 * request at a time, a follow-up request when something asked meanwhile, retry with backoff after
 * a failure, and the account hint kept in step with what the server said.
 *
 * Notes:
 * The hint is written on every signed-in answer and cleared on every explicit signed-out answer
 * (HTTP 200 without a user, or 404); a failed request touches nothing. Retries are scheduled only
 * while the browser reports online: offline, the `online` event is the retry.
 */
import type { IAccountState } from "../auth.type";
import {
  LOADING_ACCOUNT,
  fetchAccountSession,
  nextAccountState,
  retryDelayMs,
} from "./accountSession";
import { toAccountHint } from "./accountHint";
import type {
  IAccountSessionController,
  IAccountSessionControllerDeps,
} from "./accountSessionController.type";

export function createAccountSessionController(
  deps: IAccountSessionControllerDeps,
): IAccountSessionController {
  let current: IAccountState = LOADING_ACCOUNT;
  let running: Promise<void> | null = null;
  let again = false;
  let failures = 0;
  let retryTimer: unknown = null;
  let disposed = false;

  const cancelRetry = () => {
    if (retryTimer !== null) deps.clearTimer(retryTimer);
    retryTimer = null;
  };

  const run = async (): Promise<void> => {
    do {
      again = false;
      cancelRetry();
      const result = await fetchAccountSession(deps.fetchFn);
      if (disposed) return;
      const next = nextAccountState(current, result, deps.readHint());
      if (result.kind === "signedIn" && next.user) deps.writeHint(toAccountHint(next.user));
      if (result.kind === "signedOut") deps.clearHint();
      if (next !== current) {
        current = next;
        deps.onState(next);
      }
      if (result.kind === "failed") {
        failures += 1;
        if (deps.isOnline()) {
          retryTimer = deps.setTimer(() => {
            retryTimer = null;
            void refresh();
          }, retryDelayMs(failures));
        }
      } else {
        failures = 0;
      }
    } while (again);
  };

  function refresh(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (running) {
      again = true;
      return running;
    }
    running = run().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    refresh,
    online: () => {
      failures = 0;
      return refresh();
    },
    poll: () => {
      const settledSignedOut = current.status === "signedOut" && !current.provisional;
      return deps.isOnline() && !settledSignedOut ? refresh() : Promise.resolve();
    },
    dispose: () => {
      disposed = true;
      cancelRetry();
    },
  };
}
