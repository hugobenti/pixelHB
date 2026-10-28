import { describe, expect, it } from "vitest";

import { shouldReloadEditorArtwork } from "./editorReload";

const loaded = (signedIn: boolean) => ({ artworkId: "a", signedIn });

describe("shouldReloadEditorArtwork", () => {
  it("reloads when nothing is loaded yet", () => {
    expect(shouldReloadEditorArtwork(null, { artworkId: "a", signedIn: true })).toBe(true);
  });
  it("reloads for another artwork", () => {
    expect(shouldReloadEditorArtwork(loaded(false), { artworkId: "b", signedIn: true })).toBe(true);
    expect(shouldReloadEditorArtwork(loaded(true), { artworkId: "b", signedIn: true })).toBe(true);
  });
  it("keeps the loaded artwork when the account only becomes signed in", () => {
    expect(shouldReloadEditorArtwork(loaded(false), { artworkId: "a", signedIn: true })).toBe(
      false,
    );
  });
  it("reloads when the account signs out", () => {
    expect(shouldReloadEditorArtwork(loaded(true), { artworkId: "a", signedIn: false })).toBe(true);
  });
  it("reloads when the signed-in owner changes (same signed-in flag, new owner)", () => {
    expect(shouldReloadEditorArtwork(loaded(true), { artworkId: "a", signedIn: true })).toBe(true);
  });
});
