/**
 * Purpose:
 * EditorSettingsDrawer view model: enter/exit motion and backdrop close (useLayersDrawerPanel), drill-in
 * navigation (useCanvasSizePanel), export actions, the menu rows' hints and handlers, and Escape that
 * returns from a drill-in view to the menu before it closes the drawer.
 */
"use client";

import { useEffect } from "react";

import { editor } from "@/content/editor";
import { useCanvasSizePanel } from "@/features/editor/components/EditorSettingsDrawer/hooks/useCanvasSizePanel";
import { useImportExportPanel } from "@/features/editor/components/EditorSettingsDrawer/hooks/useImportExportPanel";
import { useLayersDrawerPanel } from "@/features/editor/components/LayersDrawer/useLayersDrawerPanel";
import type { IEditorSettingsDrawerProps } from "../EditorSettingsDrawer.type";

export function useEditorSettingsDrawer({
  artwork,
  onApplyCanvasSize,
  onToggleGrid,
  hasReferenceImage,
  onToggleReferenceImage,
  onLoadReferenceImage,
  onClose,
}: IEditorSettingsDrawerProps) {
  const canvasSize = useCanvasSizePanel({ artwork, onApplyResized: onApplyCanvasSize });
  const { settingsView, backToMenu } = canvasSize;
  const { credit, creditHint, exportJson, exportPng, scaleOptions, selectScale, setCredit } =
    useImportExportPanel({ artwork });
  const { panelEntered, handleClose } = useLayersDrawerPanel({ onClose });

  const inDrillIn = settingsView !== "menu";

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (inDrillIn) {
        backToMenu();
        return;
      }
      handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, inDrillIn, backToMenu]);

  const { menu } = editor.settings;

  return {
    ...canvasSize,
    panelEntered,
    handleClose,
    title: editor.settings.titles[settingsView],
    showBackButton: inDrillIn,
    referenceHint: hasReferenceImage ? undefined : menu.referenceImage.unavailable,
    sizeHint: menu.canvasSize.hint(artwork.width, artwork.height),
    toggleGrid: () => {
      onToggleGrid();
    },
    toggleReferenceImage: () => {
      if (!hasReferenceImage) {
        return;
      }
      onToggleReferenceImage();
    },
    loadReferenceImage: () => {
      onLoadReferenceImage();
    },
    exportJson,
    credit,
    creditHint,
    scaleOptions,
    selectScale,
    setCredit,
    exportPng: () => {
      void exportPng();
    },
  };
}
