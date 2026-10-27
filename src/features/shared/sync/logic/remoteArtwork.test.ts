import { describe, expect, it } from "vitest";

import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { serializeArtworkFile } from "@/features/shared/artwork/artworkFileFormat";
import { pngBase64FromDataUrl, remoteFileToArtwork } from "./remoteArtwork";

const artwork: IArtwork = {
  id: "a", title: "Sprite", width: 2, height: 1, createdAt: 10, updatedAt: 20, thumbnail: "data:image/png;base64,AAAA",
  palette: ["#000000", "#FFFFFF"], activeLayerId: "l",
  layers: [{ id: "l", name: "Layer 1", visible: true, pixelData: new Uint8Array([0, 1]) }],
};
const driveJson = () => JSON.parse(JSON.stringify(serializeArtworkFile(artwork)));

describe("remoteFileToArtwork", () => {
  it("restores the artwork with Drive's id and timestamps", () => {
    const expected: Partial<IArtwork> = { ...artwork };
    delete expected.thumbnail;
    expect(remoteFileToArtwork(driveJson(), "a")).toEqual(expected);
  });
  it("skips a hand-edited file that no longer parses", () => {
    expect(remoteFileToArtwork({ ...driveJson(), layers: "oops" }, "a")).toBeNull();
  });
  it("skips a file with no v3 metadata", () => {
    const v2 = driveJson();
    delete v2.id;
    delete v2.createdAt;
    delete v2.updatedAt;
    expect(remoteFileToArtwork({ ...v2, version: 2 }, "a")).toBeNull();
  });
  it("skips a file whose id is not the one requested", () => {
    expect(remoteFileToArtwork(driveJson(), "b")).toBeNull();
  });
});

describe("pngBase64FromDataUrl", () => {
  it("returns only the base64 payload of a PNG data URL", () => {
    expect(pngBase64FromDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe("iVBORw0KGgo=");
  });
  it("rejects empty and non-PNG thumbnails", () => {
    expect(pngBase64FromDataUrl("")).toBeNull();
    expect(pngBase64FromDataUrl("data:image/png;base64,")).toBeNull();
    expect(pngBase64FromDataUrl("data:image/webp;base64,UklGR")).toBeNull();
  });
});
