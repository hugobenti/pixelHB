/**
 * Purpose:
 * Handle export actions for the editor settings file transfer panel.
 */
"use client";

import { useCallback, useMemo, useState } from "react";

import { editor } from "@/content/editor";
import { capture } from "@/features/shared/analytics/analytics";
import {
  exportArtworkAsJson,
  exportArtworkAsPng,
  triggerFileDownload,
} from "@/features/shared/artwork/artworkFileService";
import { CREDIT_MIN_EXPORT_WIDTH, creditStripHeight } from "@/features/shared/artwork/creditStrip";
import {
  readStoredExportCredit,
  readStoredExportScale,
  writeStoredExportCredit,
  writeStoredExportScale,
} from "@/features/shared/artwork/exportPreferences";
import {
  allowedExportScales,
  EXPORT_SCALES,
  exportSize,
  noStrip,
  resolveExportScale,
} from "@/features/shared/artwork/exportScale";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import { shareImage } from "@/features/shared/artwork/shareImage";
import type { IShareEnv } from "@/features/shared/artwork/shareImage.type";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import { usePreparedPng } from "./usePreparedPng";
import type { IExportScaleOption, IUseImportExportPanelParams } from "./useImportExportPanel.type";

export function useImportExportPanel({ artwork, active }: IUseImportExportPanelParams) {
  const { showToast } = useToast();
  const [storedScale, setStoredScale] = useState<TExportScale | null>(() =>
    readStoredExportScale(() => localStorage),
  );
  const [credit, setCreditState] = useState(() => readStoredExportCredit(() => localStorage));
  const stripHeight = credit ? creditStripHeight : noStrip;
  const scale = resolveExportScale(storedScale, artwork, stripHeight);
  const chosenWidth = artwork.width * scale;
  const creditHint =
    credit && chosenWidth < CREDIT_MIN_EXPORT_WIDTH
      ? editor.settings.export.credit.tooNarrow
      : null;

  const scaleOptions = useMemo((): IExportScaleOption[] => {
    const allowed = allowedExportScales(artwork, stripHeight);
    return EXPORT_SCALES.map((option) => {
      const size = exportSize(artwork, option, stripHeight);
      const disabled = !allowed.includes(option);
      return {
        scale: option,
        label: editor.settings.export.scaleOption(option, size.width, size.height),
        pressed: option === scale,
        disabled,
        description: disabled ? editor.settings.export.scaleTooLarge : undefined,
        descriptionId: `export-scale-${option}-description`,
      };
    });
  }, [artwork, scale, stripHeight]);

  const selectScale = useCallback((next: TExportScale) => {
    setStoredScale(next);
    writeStoredExportScale(() => localStorage, next);
  }, []);

  const setCredit = useCallback((on: boolean) => {
    setCreditState(on);
    writeStoredExportCredit(() => localStorage, on);
  }, []);

  const { png } = usePreparedPng({
    artwork,
    scale,
    credit,
    active,
    onError: (error) => {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    },
  });

  const share = useCallback(async () => {
    if (!png) {
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
    if (typeof navigator.clipboard?.write === "function" && typeof ClipboardItem !== "undefined") {
      env.writeImage = (blob) =>
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    }
    const method = await shareImage(png, env);
    if (method === "cancelled") {
      return;
    }
    capture("share", { method, scale, credit: png.credit });
    if (method === "clipboard") {
      showToast({ message: editor.settings.export.copied, tone: "success" });
    } else if (method === "download") {
      showToast({ message: editor.settings.export.pngDone, tone: "success" });
    }
  }, [png, scale, showToast]);

  const exportJson = useCallback(() => {
    exportArtworkAsJson(artwork);
    capture("export_json");
    showToast({ message: editor.settings.export.jsonDone, tone: "success" });
  }, [artwork, showToast]);

  const exportPng = useCallback(async () => {
    try {
      const { credit: drawn } = await exportArtworkAsPng(artwork, { scale, credit });
      capture("export_png", { scale, credit: drawn });
      showToast({ message: editor.settings.export.pngDone, tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    }
  }, [artwork, scale, credit, showToast]);

  return {
    credit,
    creditHint,
    exportJson,
    exportPng,
    scale,
    scaleOptions,
    selectScale,
    setCredit,
    share,
    shareDisabled: !png,
    shareLabel: png ? editor.settings.export.share : editor.settings.export.preparing,
  };
}
