import { describe, expect, it } from "vitest";

import type { IStoredArtwork } from "@/features/shared/artwork/artworkSync.type";
import { signOutDialogView } from "./signOutDialogView";

const art = {} as IStoredArtwork;

describe("signOutDialogView", () => {
  it("stays closed while checking, signing out or idle", () => {
    for (const p of ["idle", "checking", "signingOut"] as const) {
      expect(signOutDialogView(p, null).step).toBe("closed");
    }
  });

  it("asks with a Download button only when there are artworks", () => {
    expect(signOutDialogView("asking", { artworks: [art], deletionCount: 0 })).toEqual({
      step: "unsynced",
      canDownload: true,
      busy: false,
    });
    expect(signOutDialogView("asking", { artworks: [], deletionCount: 2 })).toEqual({
      step: "unsynced",
      canDownload: false,
      busy: false,
    });
  });

  it("shows an unreadable step, not a dead dialog, when the local state could not be read", () => {
    expect(signOutDialogView("asking", null)).toEqual({
      step: "unreadable",
      canDownload: false,
      busy: false,
    });
  });

  it("keeps the same step with everything disabled while downloading", () => {
    expect(signOutDialogView("downloading", { artworks: [art], deletionCount: 0 })).toEqual({
      step: "unsynced",
      canDownload: true,
      busy: true,
    });
  });

  it("moves on to the downloads check", () => {
    expect(signOutDialogView("downloaded", { artworks: [art], deletionCount: 0 }).step).toBe(
      "downloaded",
    );
  });
});
