import { describe, expect, it, vi } from "vitest";

import { shareImage } from "./shareImage";
import type { IShareEnv, IShareablePng } from "./shareImage.type";

const blob = new Blob([new Uint8Array([1])], { type: "image/png" });
const file = { name: "a.png" } as File;
const png: IShareablePng = { blob, file };

function domError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("shareImage", () => {
  it("uses the share sheet with the file only", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const env: IShareEnv = { canShare: () => true, share, download: vi.fn() };
    await expect(shareImage(png, env)).resolves.toBe("native");
    expect(share).toHaveBeenCalledWith({ files: [file] });
    expect(share.mock.calls[0][0]).toEqual({ files: [file] });
    expect(env.download).not.toHaveBeenCalled();
  });

  it("AbortError → cancelled, nothing else called", async () => {
    const writeImage = vi.fn();
    const env: IShareEnv = {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(domError("AbortError")),
      writeImage,
      download: vi.fn(),
    };
    await expect(shareImage(png, env)).resolves.toBe("cancelled");
    expect(writeImage).not.toHaveBeenCalled();
    expect(env.download).not.toHaveBeenCalled();
  });

  it("NotAllowedError → download", async () => {
    const env: IShareEnv = {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(domError("NotAllowedError")),
      download: vi.fn(),
    };
    await expect(shareImage(png, env)).resolves.toBe("download");
    expect(env.download).toHaveBeenCalledOnce();
  });

  it("canShare false → copies to the clipboard", async () => {
    const writeImage = vi.fn().mockResolvedValue(undefined);
    const env: IShareEnv = {
      canShare: () => false,
      share: vi.fn(),
      writeImage,
      download: vi.fn(),
    };
    const pending = shareImage(png, env);
    expect(writeImage).toHaveBeenCalledWith(blob);
    await expect(pending).resolves.toBe("clipboard");
    expect(env.share).not.toHaveBeenCalled();
    expect(env.download).not.toHaveBeenCalled();
  });

  it("clipboard write rejects → download", async () => {
    const env: IShareEnv = {
      writeImage: vi.fn().mockRejectedValue(domError("NotAllowedError")),
      download: vi.fn(),
    };
    await expect(shareImage(png, env)).resolves.toBe("download");
    expect(env.download).toHaveBeenCalledOnce();
  });

  it("no share, no clipboard → download", async () => {
    const env: IShareEnv = { download: vi.fn() };
    await expect(shareImage(png, env)).resolves.toBe("download");
    expect(env.download).toHaveBeenCalledOnce();
  });
});
