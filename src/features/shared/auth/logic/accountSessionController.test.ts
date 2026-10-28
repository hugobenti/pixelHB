import { describe, expect, it, vi } from "vitest";

import type { IAccountHint, IAccountState } from "../auth.type";
import { createAccountSessionController } from "./accountSessionController";

const session = {
  user: { id: "g1", name: "Ada", email: "ada@example.com", image: null },
  expires: "x",
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function setup(options: {
  responses: (Response | Error)[];
  hint?: IAccountHint | null;
  online?: boolean;
}) {
  const queue = [...options.responses];
  const resolvers: (() => void)[] = [];
  const fetchFn = vi.fn<typeof fetch>(async () => {
    const next = queue.shift();
    if (next === undefined) throw new Error("no response queued");
    if (next instanceof Error) throw next;
    return next;
  });
  const states: IAccountState[] = [];
  const timers: { callback: () => void; ms: number; cleared: boolean }[] = [];
  let hint: IAccountHint | null = options.hint ?? null;
  const env = { online: options.online ?? true };
  const controller = createAccountSessionController({
    fetchFn,
    readHint: () => hint,
    writeHint: (next) => {
      hint = next;
    },
    clearHint: () => {
      hint = null;
    },
    isOnline: () => env.online,
    nowMs: () => 5000,
    setTimer: (callback, ms) => {
      const timer = {
        ms,
        cleared: false,
        callback: () => {
          timer.cleared = true;
          callback();
        },
      };
      timers.push(timer);
      return timer;
    },
    clearTimer: (handle) => {
      (handle as { cleared: boolean }).cleared = true;
    },
    onState: (state) => states.push(state),
  });
  const live = () => timers.filter((timer) => !timer.cleared);
  return { controller, fetchFn, states, timers, live, env, getHint: () => hint, resolvers };
}

const networkError = () => new TypeError("Failed to fetch");

describe("createAccountSessionController", () => {
  it("signs in, remembers the hint (no email) and polls", async () => {
    const t = setup({ responses: [ok(session), ok(session)] });
    await t.controller.refresh();
    expect(t.states.map((s) => s.status)).toEqual(["signedIn"]);
    expect(t.getHint()).toEqual({ id: "g1", name: "Ada", image: null, savedAt: 5000 });
    await t.controller.poll();
    expect(t.fetchFn).toHaveBeenCalledTimes(2);
    expect(t.states).toHaveLength(1);
  });

  it("clears the hint and stops polling after an explicit null", async () => {
    const t = setup({
      responses: [ok(null)],
      hint: { id: "g1", name: "Ada", image: null, savedAt: 1000 },
    });
    await t.controller.refresh();
    expect(t.states.map((s) => s.status)).toEqual(["signedOut"]);
    expect(t.states[0].provisional).toBeUndefined();
    expect(t.getHint()).toBeNull();
    await t.controller.poll();
    expect(t.fetchFn).toHaveBeenCalledTimes(1);
  });

  it("first request fails without a hint: provisional signed out, retry scheduled, then corrected", async () => {
    const t = setup({ responses: [networkError(), ok(session)] });
    await t.controller.refresh();
    expect(t.states).toEqual([
      { status: "signedOut", user: null, needsReauth: false, provisional: true },
    ]);
    expect(t.live()).toHaveLength(1);
    expect(t.live()[0].ms).toBe(2000);
    t.live()[0].callback();
    await vi.waitFor(() =>
      expect(t.states.map((s) => s.status)).toEqual(["signedOut", "signedIn"]),
    );
    expect(t.states[1].provisional).toBeUndefined();
    expect(t.live()).toHaveLength(0);
  });

  it("first request fails with a hint: provisional signed in as the hinted owner; polling continues", async () => {
    const t = setup({
      responses: [networkError(), ok(null)],
      hint: { id: "g9", name: "", image: null, savedAt: 1000 },
    });
    await t.controller.refresh();
    expect(t.states[0]).toMatchObject({
      status: "signedIn",
      provisional: true,
      user: { id: "g9", email: "" },
    });
    await t.controller.poll();
    expect(t.states.map((s) => s.status)).toEqual(["signedIn", "signedOut"]);
    expect(t.getHint()).toBeNull();
  });

  it("backs off 2 s, 4 s, 8 s and resets after a success or the online event", async () => {
    const t = setup({
      responses: [networkError(), networkError(), networkError(), networkError(), ok(session)],
    });
    await t.controller.refresh();
    for (let i = 0; i < 2; i += 1) {
      t.live()[0].callback();
      await vi.waitFor(() => expect(t.fetchFn).toHaveBeenCalledTimes(i + 2));
      await vi.waitFor(() => expect(t.live().length).toBe(1));
    }
    expect(t.timers.map((timer) => timer.ms)).toEqual([2000, 4000, 8000]);
    await t.controller.online();
    expect(t.timers.map((timer) => timer.ms)).toEqual([2000, 4000, 8000, 2000]);
    await t.controller.online();
    expect(t.live()).toHaveLength(0);
  });

  it("schedules no retry while offline; the online event refreshes", async () => {
    const t = setup({ responses: [networkError(), ok(session)], online: false });
    await t.controller.refresh();
    expect(t.timers).toHaveLength(0);
    t.env.online = true;
    await t.controller.online();
    expect(t.states.at(-1)?.status).toBe("signedIn");
  });

  it("keeps a signed-in state through failures", async () => {
    const t = setup({
      responses: [ok(session), networkError(), new Response("x", { status: 500 })],
    });
    await t.controller.refresh();
    await t.controller.refresh();
    await t.controller.refresh();
    expect(t.states.map((s) => s.status)).toEqual(["signedIn"]);
    expect(t.getHint()?.id).toBe("g1");
  });

  it("runs one request at a time and one follow-up for any number of calls meanwhile", async () => {
    const t = setup({ responses: [ok(null), ok(session)] });
    const first = t.controller.refresh();
    void t.controller.refresh();
    const third = t.controller.refresh();
    expect(t.fetchFn).toHaveBeenCalledTimes(1);
    await Promise.all([first, third]);
    expect(t.fetchFn).toHaveBeenCalledTimes(2);
    expect(t.states.map((s) => s.status)).toEqual(["signedOut", "signedIn"]);
  });

  it("a new refresh cancels a pending retry", async () => {
    const t = setup({ responses: [networkError(), ok(session)] });
    await t.controller.refresh();
    expect(t.live()).toHaveLength(1);
    await t.controller.refresh();
    expect(t.live()).toHaveLength(0);
  });

  it("ignores answers after dispose and cancels the retry", async () => {
    const t = setup({ responses: [ok(session)] });
    const pending = t.controller.refresh();
    t.controller.dispose();
    await pending;
    expect(t.states).toHaveLength(0);
    await t.controller.refresh();
    expect(t.fetchFn).toHaveBeenCalledTimes(1);
  });

  it("poll is skipped offline", async () => {
    const t = setup({ responses: [ok(session)], online: false });
    await t.controller.poll();
    expect(t.fetchFn).not.toHaveBeenCalled();
  });
});

describe("fetch timeout", () => {
  it("uses the short timeout until the first answer, the long one afterwards", async () => {
    const spy = vi.spyOn(AbortSignal, "timeout");
    const t = setup({ responses: [networkError(), ok(session), ok(session)] });
    await t.controller.refresh();
    await t.controller.refresh();
    await t.controller.refresh();
    expect(spy.mock.calls.map(([ms]) => ms)).toEqual([6000, 15_000, 15_000]);
    spy.mockRestore();
  });
});
