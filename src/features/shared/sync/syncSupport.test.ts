import { afterEach, describe, expect, it, vi } from "vitest";

import { isSyncSupported } from "./syncSupport";

describe("isSyncSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is true in a browser with Web Locks", () => {
    vi.stubGlobal("navigator", { locks: {} });
    expect(isSyncSupported()).toBe(true);
  });

  it("is false in a browser without Web Locks", () => {
    vi.stubGlobal("navigator", {});
    expect(isSyncSupported()).toBe(false);
  });

  it("is false outside a browser", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isSyncSupported()).toBe(false);
  });
});
