import { describe, expect, test, vi } from "vitest";

import type { IAnalyticsClient } from "./analytics.type";
import { ANALYTICS_CONSENT_KEY } from "./analyticsConsent";
import { createAnalyticsController } from "./analyticsController";

function fakeClient(optedOut = false) {
  const calls: string[] = [];
  let out = optedOut;
  const client: IAnalyticsClient = {
    capture: vi.fn(),
    has_opted_out_capturing: () => out,
    opt_in_capturing: () => {
      out = false;
      calls.push("opt_in");
    },
    opt_out_capturing: () => {
      out = true;
      calls.push("opt_out");
    },
    reset: () => calls.push("reset"),
    startSessionRecording: () => calls.push("start_recording"),
    stopSessionRecording: () => calls.push("stop_recording"),
  };
  return { client, calls };
}

function setup({
  token = "phc_test" as string | null,
  stored = null as string | null,
  optedOut = false,
} = {}) {
  const values = new Map<string, string>();
  if (stored !== null) values.set(ANALYTICS_CONSENT_KEY, stored);
  const { client, calls } = fakeClient(optedOut);
  const load = vi.fn(async () => client);
  const controller = createAnalyticsController({
    token: token ?? undefined,
    storage: { get: (key) => values.get(key) ?? null, set: (key, value) => values.set(key, value) },
    load,
  });
  return { controller, client, calls, load, values };
}

describe("without a token", () => {
  test("is disabled and never loads, even when consent is stored", async () => {
    for (const token of [null, "", "   "]) {
      const { controller, load } = setup({ token, stored: "granted" });
      expect(controller.enabled).toBe(false);
      controller.start();
      controller.setConsent("granted");
      controller.capture("export_png");
      await controller.ready();
      expect(load).not.toHaveBeenCalled();
    }
  });
});

describe("initialisation", () => {
  test("does not load PostHog before a choice", async () => {
    const { controller, load } = setup();
    controller.start();
    await controller.ready();
    expect(controller.getConsent()).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  test("does not load PostHog when consent was declined", async () => {
    const { controller, load } = setup({ stored: "denied" });
    controller.start();
    await controller.ready();
    expect(load).not.toHaveBeenCalled();
  });

  test("loads PostHog on start when consent was already granted", async () => {
    const { controller, load } = setup({ stored: "granted" });
    controller.start();
    await controller.ready();
    expect(load).toHaveBeenCalledWith("phc_test");
  });

  test("loads PostHog once on accept, and stores the choice", async () => {
    const { controller, load, values } = setup();
    controller.setConsent("granted");
    controller.start();
    controller.setConsent("granted");
    await controller.ready();
    expect(load).toHaveBeenCalledTimes(1);
    expect(values.get(ANALYTICS_CONSENT_KEY)).toBe("granted");
    expect(controller.getConsent()).toBe("granted");
  });

  test("clears an opt-out PostHog kept from an earlier withdrawal", async () => {
    const { controller, calls } = setup({ stored: "granted", optedOut: true });
    controller.start();
    await controller.ready();
    expect(calls).toEqual(["opt_in", "start_recording"]);
  });

  test("leaves a fresh client alone", async () => {
    const { controller, calls } = setup({ stored: "granted" });
    controller.start();
    await controller.ready();
    expect(calls).toEqual([]);
  });
});

describe("capture", () => {
  test("is a no-op without consent", async () => {
    const { controller, client, load } = setup();
    controller.capture("artwork_created", { width: 32, height: 32 });
    controller.setConsent("denied");
    controller.capture("export_json");
    await controller.ready();
    expect(load).not.toHaveBeenCalled();
    expect(client.capture).not.toHaveBeenCalled();
  });

  test("sends the event with its properties once consent is granted", async () => {
    const { controller, client } = setup({ stored: "granted" });
    controller.start();
    controller.capture("artwork_created", { width: 16, height: 24 });
    controller.capture("sync_error", { kind: "driveFull" });
    await controller.ready();
    expect(client.capture).toHaveBeenCalledWith("artwork_created", { width: 16, height: 24 });
    expect(client.capture).toHaveBeenCalledWith("sync_error", { kind: "driveFull" });
  });

  test("drops an event captured while loading if consent is withdrawn before it lands", async () => {
    const { controller, client } = setup({ stored: "granted" });
    controller.start();
    controller.capture("export_png");
    controller.setConsent("denied");
    await controller.ready();
    expect(client.capture).not.toHaveBeenCalled();
  });
});

describe("withdrawing consent", () => {
  test("stops recording, resets and opts out, in an order that keeps the opt-out", async () => {
    const { controller, client, calls, values } = setup({ stored: "granted" });
    controller.start();
    await controller.ready();
    controller.setConsent("denied");
    expect(calls).toEqual(["stop_recording", "reset", "opt_out"]);
    expect(values.get(ANALYTICS_CONSENT_KEY)).toBe("denied");
    controller.capture("export_png");
    await controller.ready();
    expect(client.capture).not.toHaveBeenCalled();
  });

  test("granting again opts back in and resumes recording without reloading", async () => {
    const { controller, calls, load } = setup({ stored: "granted" });
    controller.start();
    await controller.ready();
    controller.setConsent("denied");
    controller.setConsent("granted");
    await controller.ready();
    expect(load).toHaveBeenCalledTimes(1);
    expect(calls.slice(-2)).toEqual(["opt_in", "start_recording"]);
  });
});

describe("subscribe", () => {
  test("notifies on every change of choice until unsubscribed", () => {
    const { controller } = setup();
    const listener = vi.fn();
    const off = controller.subscribe(listener);
    controller.setConsent("denied");
    controller.setConsent("granted");
    off();
    controller.setConsent("denied");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
