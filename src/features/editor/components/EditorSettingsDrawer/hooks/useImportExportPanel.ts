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
} from "@/features/shared/artwork/artworkFileService";
import { EXPORT_SCALE_KEY, parseExportScale } from "@/features/shared/artwork/exportPreferences";
import {
  allowedExportScales,
  EXPORT_SCALES,
  exportSize,
  resolveExportScale,
} from "@/features/shared/artwork/exportScale";
import type { TExportScale } from "@/features/shared/artwork/exportScale.type";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import type { IExportScaleOption, IUseImportExportPanelParams } from "./useImportExportPanel.type";

/** PR 1 draws no credit strip, so exports add no height. */
const noStrip = () => 0;

function readStoredScale(): TExportScale | null {
  try {
    return parseExportScale(localStorage.getItem(EXPORT_SCALE_KEY));
  } catch {
    return null;
  }
}

function writeStoredScale(scale: TExportScale): void {
  try {
    localStorage.setItem(EXPORT_SCALE_KEY, String(scale));
  } catch {
    // Storage unavailable: the choice just isn't remembered.
  }
}

export function useImportExportPanel({ artwork }: IUseImportExportPanelParams) {
  const { showToast } = useToast();
  const [storedScale, setStoredScale] = useState<TExportScale | null>(readStoredScale);
  const scale = resolveExportScale(storedScale, artwork, noStrip);

  const scaleOptions = useMemo((): IExportScaleOption[] => {
    const allowed = allowedExportScales(artwork, noStrip);
    return EXPORT_SCALES.map((option) => {
      const size = exportSize(artwork, option, noStrip);
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
  }, [artwork, scale]);

  const selectScale = useCallback((next: TExportScale) => {
    setStoredScale(next);
    writeStoredScale(next);
  }, []);

  const exportJson = useCallback(() => {
    exportArtworkAsJson(artwork);
    capture("export_json");
    showToast({ message: editor.settings.export.jsonDone, tone: "success" });
  }, [artwork, showToast]);

  const exportPng = useCallback(async () => {
    try {
      const { credit } = await exportArtworkAsPng(artwork, { scale, credit: false });
      capture("export_png", { scale, credit });
      showToast({ message: editor.settings.export.pngDone, tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    }
  }, [artwork, scale, showToast]);

  return {
    exportJson,
    exportPng,
    scale,
    scaleOptions,
    selectScale,
  };
}
