import { describe, expect, it } from "vitest";

import { shouldReloadEditorArtwork } from "./editorReload";

const out = { artworkId: "a", signedIn: false, ownerId: null };
const inAs = (ownerId: string, artworkId = "a") => ({ artworkId, signedIn: true, ownerId });

describe("shouldReloadEditorArtwork", () => {
  it("reloads when nothing is loaded yet", () => {
    expect(shouldReloadEditorArtwork(null, inAs("u1"))).toBe(true);
  });
  it("reloads for another artwork", () => {
    expect(shouldReloadEditorArtwork(out, inAs("u1", "b"))).toBe(true);
    expect(shouldReloadEditorArtwork(inAs("u1"), inAs("u1", "b"))).toBe(true);
  });
  it("keeps the loaded artwork when the account only becomes signed in", () => {
    expect(shouldReloadEditorArtwork(out, inAs("u1"))).toBe(false);
  });
  it("reloads when the account signs out", () => {
    expect(shouldReloadEditorArtwork(inAs("u1"), out)).toBe(true);
  });
  it("reloads when the signed-in owner changes", () => {
    expect(shouldReloadEditorArtwork(inAs("u1"), inAs("u2"))).toBe(true);
  });
  it("does not reload when nothing about the account or the artwork changed", () => {
    expect(shouldReloadEditorArtwork(inAs("u1"), inAs("u1"))).toBe(false);
    expect(shouldReloadEditorArtwork(out, out)).toBe(false);
  });
});
