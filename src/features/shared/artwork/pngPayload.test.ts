import { describe, expect, it } from "vitest";

import { pngBlobFromDataUrl } from "./pngPayload";

describe("pngBlobFromDataUrl", () => {
  it("decodes a base64 PNG data URL", () => {
    const blob = pngBlobFromDataUrl("data:image/png;base64,AQID");
    expect(blob.size).toBe(3);
    expect(blob.type).toBe("image/png");
  });

  it("throws pngFailed on an empty payload", () => {
    expect(() => pngBlobFromDataUrl("data:,")).toThrow("Failed to export PNG.");
  });
});
