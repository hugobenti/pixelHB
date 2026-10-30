/**
 * Purpose:
 * Handle export actions for the editor settings file transfer panel.
 */
"use client";

import { useCallback } from "react";

import { editor } from "@/content/editor";
import { capture } from "@/features/shared/analytics/analytics";
import {
  exportArtworkAsJson,
  exportArtworkAsPng,
} from "@/features/shared/artwork/artworkFileService";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import type { IUseImportExportPanelParams } from "./useImportExportPanel.type";

export function useImportExportPanel({
  artwork,
}: IUseImportExportPanelParams) {
  const { showToast } = useToast();

  const exportJson = useCallback(() => {
    exportArtworkAsJson(artwork);
    capture("export_json");
    showToast({ message: editor.settings.export.jsonDone, tone: "success" });
  }, [artwork, showToast]);

  const exportPng = useCallback(async () => {
    try {
      await exportArtworkAsPng(artwork);
      capture("export_png");
      showToast({ message: editor.settings.export.pngDone, tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : editor.settings.export.pngFailed;
      showToast({ message, tone: "error" });
    }
  }, [artwork, showToast]);

  return {
    exportJson,
    exportPng,
  };
}
