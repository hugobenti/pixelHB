/**
 * Purpose:
 * Share a rendered PNG (share sheet → clipboard → download) with the toasts and `share` event
 * the editor and the gallery have in common.
 *
 * Notes:
 * `share` starts `shareImage` synchronously, before its first `await`, so the click's user
 * activation is still live for the share sheet and the clipboard write.
 */
"use client";

import { useCallback, useState } from "react";

import { shared } from "@/content/shared";
import { capture } from "@/features/shared/analytics/analytics";
import { triggerFileDownload } from "@/features/shared/artwork/artworkFileService";
import { shareImage } from "@/features/shared/artwork/shareImage";
import type { IShareEnv } from "@/features/shared/artwork/shareImage.type";
import type { IPreparedPng } from "@/features/shared/artwork/usePreparedPng.type";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import type { IShareAnalytics, IUseShareImageParams } from "./useShareImage.type";

export function useShareImage({ from }: IUseShareImageParams) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const share = useCallback(
    async (png: IPreparedPng, { scale }: IShareAnalytics) => {
      if (sharing) {
        return;
      }
      const env: IShareEnv = {
        download: () => triggerFileDownload(png.blob, png.fileName),
      };
      if (typeof navigator.share === "function") {
        env.share = (data) => navigator.share(data);
      }
      if (typeof navigator.canShare === "function") {
        env.canShare = (data) => navigator.canShare(data);
      }
      if (
        typeof navigator.clipboard?.write === "function" &&
        typeof ClipboardItem !== "undefined"
      ) {
        env.writeImage = (blob) =>
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }
      setSharing(true);
      let method: Awaited<ReturnType<typeof shareImage>>;
      try {
        method = await shareImage(png, env);
      } finally {
        setSharing(false);
      }
      if (method === "cancelled") {
        return;
      }
      capture("share", { method, scale, credit: png.credit, from });
      if (method === "clipboard") {
        showToast({ message: shared.share.copied, tone: "success" });
      } else if (method === "download") {
        showToast({ message: shared.share.downloaded, tone: "success" });
      }
    },
    [from, sharing, showToast],
  );

  return { share, sharing };
}
