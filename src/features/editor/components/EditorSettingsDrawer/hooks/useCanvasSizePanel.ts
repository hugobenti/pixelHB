/**
 * Purpose:
 * Drill-in navigation and state for editor settings subpanels. Cropping confirms the lost pixels and history.
 */
"use client";

import { useCallback, useState } from "react";

import { editor } from "@/content/editor";
import { resizeArtworkDimensions } from "@/features/editor/logic/resizeCanvas";
import { useConfirm } from "@/features/shared/components/useConfirm";
import type { TEditorSettingsView, IUseCanvasSizePanelParams } from "./useCanvasSizePanel.type";

export function useCanvasSizePanel({ artwork, onApplyResized, initialView }: IUseCanvasSizePanelParams) {
  const { confirm, dialog: shrinkDialog } = useConfirm();
  const [settingsView, setSettingsView] = useState<TEditorSettingsView>(initialView ?? "menu");
  const [widthStr, setWidthStr] = useState(String(artwork.width));
  const [heightStr, setHeightStr] = useState(String(artwork.height));

  const openCanvasSize = useCallback(() => {
    setWidthStr(String(artwork.width));
    setHeightStr(String(artwork.height));
    setSettingsView("canvasSize");
  }, [artwork.width, artwork.height]);

  const openImageDetail = useCallback(() => setSettingsView("imageDetail"), []);
  const openImportExport = useCallback(() => setSettingsView("importExport"), []);
  const backToMenu = useCallback(() => setSettingsView("menu"), []);

  const applyCanvasSize = useCallback(
    (size: { width: number; height: number }) => {
      const commit = () => {
        const next = resizeArtworkDimensions(artwork, size.width, size.height);
        if (next !== artwork) onApplyResized(next);
        setSettingsView("menu");
      };
      if (size.width >= artwork.width && size.height >= artwork.height) {
        commit();
        return;
      }
      const copy = editor.canvasShrinkDialog;
      void confirm({
        title: copy.title(size.width, size.height),
        description: copy.description(size.width, size.height),
        warning: copy.warning,
        confirmLabel: copy.confirm,
      }).then((confirmed) => {
        if (confirmed) commit();
      });
    },
    [artwork, onApplyResized, confirm],
  );

  return {
    settingsView,
    widthStr,
    heightStr,
    setWidthStr,
    setHeightStr,
    openCanvasSize,
    openImageDetail,
    openImportExport,
    backToMenu,
    applyCanvasSize,
    shrinkDialog,
  };
}
