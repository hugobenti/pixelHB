/**
 * Purpose:
 * Handle export actions for the editor settings file transfer panel.
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { editor } from "@/content/editor";
import { shared } from "@/content/shared";
import { capture } from "@/features/shared/analytics/analytics";
import {
  exportArtworkAsJson,
  exportArtworkAsPng,
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
  shareExportOptions,
} from "@/features/shared/artwork/exportScale";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import { usePreparedPng } from "@/features/shared/artwork/usePreparedPng";
import { useShareImage } from "@/features/shared/artwork/useShareImage";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
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

  const [downloading, setDownloading] = useState(false);
  // A ref too: two clicks in one tick both see the same rendered state.
  const downloadingRef = useRef(false);
  const { share: shareImage, sharing } = useShareImage({ from: "editor" });
  const shareOptions = useMemo(() => shareExportOptions(artwork), [artwork]);
  const shareSize = exportSize(artwork, shareOptions.scale, creditStripHeight);
  const shareSizeLabel = editor.settings.export.shareSize(
    shareSize.width,
    shareSize.height,
    shareSize.height > shareSize.artHeight,
  );
  const { png, failed } = usePreparedPng({
    artwork,
    scale: shareOptions.scale,
    credit: shareOptions.credit,
    active,
    onError: (error) => {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    },
  });

  const share = useCallback(() => {
    if (png) {
      void shareImage(png, { scale: shareOptions.scale });
    }
  }, [png, shareOptions.scale, shareImage]);

  const exportJson = useCallback(() => {
    exportArtworkAsJson(artwork);
    capture("export_json");
    showToast({ message: editor.settings.export.jsonDone, tone: "success" });
  }, [artwork, showToast]);

  const downloadPng = useCallback(async () => {
    if (downloadingRef.current) {
      return;
    }
    downloadingRef.current = true;
    setDownloading(true);
    try {
      const { credit: drawn } = await exportArtworkAsPng(artwork, { scale, credit });
      capture("export_png", { scale, credit: drawn });
      showToast({ message: editor.settings.export.pngDone, tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    } finally {
      downloadingRef.current = false;
      setDownloading(false);
    }
  }, [artwork, scale, credit, showToast]);

  return {
    credit,
    creditHint,
    exportJson,
    downloadPng,
    downloading,
    scale,
    scaleOptions,
    selectScale,
    setCredit,
    share,
    shareSizeLabel,
    shareDisabled: !png || sharing,
    shareLabel: failed
      ? editor.settings.export.pngFailed
      : png
        ? shared.share.label
        : shared.share.preparing,
  };
}
