/**
 * Purpose:
 * EditorWorkspace view model: the editable artwork, panel open state, and the editor hooks composed
 * into what the toolbar, palette modal, canvas, drawers and shift overlay render.
 *
 * Notes:
 * Pixel grid and symmetry-guide colors are defined on :root in globals.css (read by the canvas engine).
 * Contain-fit viewport (useContainFitViewport) uses normalizeViewportToPixelGrid so scale and offsets stay integer-aligned with wheel/pinch/pan.
 * Touch pointer tracking: useEditorPointerContacts runs before viewport navigation and pixel painting (see docs/canvas-pointer-contract.md).
 * Toolbar zoom logic lives in useToolbarCenterZoom + logic/toolbarCenterZoom.ts.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { editor } from "@/content/editor";
import { useArtworkLayers } from "@/features/editor/hooks/useArtworkLayers";
import { useCanvasEngine } from "@/features/editor/hooks/useCanvasEngine";
import { useContainFitViewport } from "@/features/editor/hooks/useContainFitViewport";
import { useEditorAutosave } from "@/features/editor/hooks/useEditorAutosave";
import { useEditorKeyboardShortcuts } from "@/features/editor/hooks/useEditorKeyboardShortcuts";
import { useEditorPalette } from "@/features/editor/hooks/useEditorPalette";
import { useEditorPointerContacts } from "@/features/editor/hooks/useEditorPointerContacts";
import { useHistory } from "@/features/editor/hooks/useHistory";
import { useColorPickerHold } from "@/features/editor/hooks/useColorPickerHold";
import { usePixelPainting } from "@/features/editor/hooks/usePixelPainting";
import { usePixelShift } from "@/features/editor/hooks/usePixelShift";
import { useReferenceImage } from "@/features/editor/hooks/useReferenceImage";
import { useToolbarCenterZoom } from "@/features/editor/hooks/useToolbarCenterZoom";
import { useViewportKeyboardPan } from "@/features/editor/hooks/useViewportKeyboardPan";
import { useViewportNavigation } from "@/features/editor/hooks/useViewportNavigation";
import { useViewportWheelAndPinch } from "@/features/editor/hooks/useViewportWheelAndPinch";
import { applyToolAction } from "@/features/editor/logic/editorTools";
import type {
  TEditorToolAction,
  TPickerReturnTool,
} from "@/features/editor/logic/editorTools.type";
import { clampPaletteIndex } from "@/features/editor/logic/paletteMutations";
import type { TColorSlot } from "@/features/editor/logic/paletteMutations.type";
import { isStrokeHidden } from "@/features/editor/logic/strokeOcclusion";
import type { IHistoryCommand } from "@/features/editor/types/editor.type";
import type { IArtwork } from "@/features/shared/artwork/artwork.type";
import { canAddLayer, MAX_PALETTE_ENTRIES } from "@/features/shared/artwork/artworkLimits";
import { useToast } from "@/features/shared/components/Toast/hooks/useToast";
import type { IEditorWorkspaceProps } from "./EditorWorkspace.type";

export function useEditorWorkspace({ initialArtwork }: IEditorWorkspaceProps) {
  const { showToast } = useToast();
  const [artwork, setArtwork] = useState<IArtwork>(initialArtwork);

  const [showPixelGrid, setShowPixelGrid] = useState(true);
  const [paintRevision, setPaintRevision] = useState(0);
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [bucketMode, setBucketMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [pickerArmed, setPickerArmed] = useState(false);
  const [pickerReturnTool, setPickerReturnTool] = useState<TPickerReturnTool>("brush");

  const artworkRef = useRef(artwork);
  useEffect(() => {
    artworkRef.current = artwork;
  }, [artwork]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = editor.screen.documentTitle(artwork.title);
    return () => {
      document.title = previousTitle;
    };
  }, [artwork.title]);

  const bumpPaintRaf = useRef<number | null>(null);
  const schedulePaintBump = useCallback(() => {
    if (bumpPaintRaf.current != null) {
      return;
    }
    bumpPaintRaf.current = window.requestAnimationFrame(() => {
      bumpPaintRaf.current = null;
      setPaintRevision((r) => r + 1);
    });
  }, []);

  const getDocument = useCallback(() => artworkRef.current, []);

  const { pushCommand, discardRedo, undo, undoCommand, redo, canUndo, canRedo, historyRevision } =
    useHistory({
      documentKey: `${artwork.id}:${artwork.width}x${artwork.height}`,
      getDocument,
    });

  const paletteUi = useEditorPalette({
    artwork,
    setArtwork,
    onPaletteOrPixelsDirty: schedulePaintBump,
    pushCommand,
    discardRedo,
    undoCommand,
  });

  const primaryPaint = clampPaletteIndex(paletteUi.primaryIndex, artwork.palette.length);
  const secondaryPaint = clampPaletteIndex(paletteUi.secondaryIndex, artwork.palette.length);

  const layersState = useArtworkLayers({
    artwork,
    setArtwork,
    onLayersChanged: schedulePaintBump,
  });

  const minScaleRef = useRef(1);
  const getMinScale = useCallback(() => minScaleRef.current, []);

  const { touchPointersRef } = useEditorPointerContacts();

  const {
    viewport,
    setViewport,
    handlers: zoomPanHandlers,
    panMode,
    setPanMode,
    deferPrimaryPaint,
  } = useViewportNavigation({ getMinScale, touchPointersRef });

  const referenceImage = useReferenceImage({
    initialReferenceImageDataUrl: artwork.referenceImageDataUrl,
    onReferenceImageChange: (dataUrl) => {
      setArtwork((prev) => ({ ...prev, referenceImageDataUrl: dataUrl }));
      schedulePaintBump();
    },
  });

  const { wrapRef, artworkCanvasRef, referenceImageCanvasRef, gridCanvasRef, cssSize } =
    useCanvasEngine({
      artwork,
      viewport,
      showPixelGrid,
      showReferenceImage: referenceImage.showReferenceImage,
      referenceImage: referenceImage.referenceImageElement,
      referenceImageAlpha: referenceImage.referenceAlpha,
      paintRevision,
      historyRevision,
    });

  const viewportMinScale = useContainFitViewport({
    cssWidth: cssSize.w,
    cssHeight: cssSize.h,
    artworkWidth: artwork.width,
    artworkHeight: artwork.height,
    setViewport,
    minScaleRef,
  });

  useViewportWheelAndPinch({
    wrapRef,
    setViewport,
    minScaleRef,
    cssWidth: cssSize.w,
    cssHeight: cssSize.h,
    artworkWidth: artwork.width,
    artworkHeight: artwork.height,
  });

  const { onZoomIn, onZoomOut, canZoomIn, canZoomOut } = useToolbarCenterZoom({
    wrapRef,
    setViewport,
    minScaleRef,
    viewportMinScale,
    viewportScale: viewport.scale,
  });

  useViewportKeyboardPan(wrapRef, setViewport);

  useEditorAutosave({
    artworkRef,
    artworkId: artwork.id,
    paintRevision,
    historyRevision,
  });

  const togglePixelGrid = () => setShowPixelGrid((v) => !v);

  const onCommitStroke = useCallback(
    (cmd: IHistoryCommand) => {
      pushCommand(cmd);
      const current = artworkRef.current;
      if (
        isStrokeHidden(
          current,
          current.activeLayerId,
          cmd.deltas.map((delta) => delta.index),
        )
      ) {
        showToast({
          message: editor.toasts.strokeHidden,
          tone: "error",
          skipDuplicateActiveToast: true,
        });
      }
    },
    [pushCommand, showToast],
  );

  const handleApplyCanvasSize = useCallback(
    (next: IArtwork) => {
      setArtwork(next);
      schedulePaintBump();
    },
    [schedulePaintBump],
  );

  const runToolAction = useCallback(
    (action: TEditorToolAction) => {
      const next = applyToolAction(
        { panMode, bucketMode, eraserMode, pickerArmed, pickerReturnTool },
        action,
      );
      setPanMode(next.panMode);
      setBucketMode(next.bucketMode);
      setEraserMode(next.eraserMode);
      setPickerArmed(next.pickerArmed);
      setPickerReturnTool(next.pickerReturnTool);
    },
    [panMode, bucketMode, eraserMode, pickerArmed, pickerReturnTool, setPanMode],
  );

  const togglePanMode = useCallback(() => runToolAction("togglePan"), [runToolAction]);
  const toggleBucketMode = useCallback(() => runToolAction("toggleBucket"), [runToolAction]);
  const toggleEraserMode = useCallback(() => runToolAction("toggleEraser"), [runToolAction]);
  const togglePicker = useCallback(() => runToolAction("togglePicker"), [runToolAction]);

  useEditorKeyboardShortcuts({
    onTogglePixelGrid: togglePixelGrid,
    onToggleEraser: toggleEraserMode,
    undo,
    redo,
  });

  const onHiddenActiveLayerPaintAttempt = useCallback(() => {
    showToast({
      message: editor.toasts.hiddenLayer,
      tone: "error",
      skipDuplicateActiveToast: true,
    });
  }, [showToast]);

  const pixelShift = usePixelShift({
    pixelData: layersState.activeLayer?.pixelData ?? null,
    layerId: layersState.activeLayer?.id ?? null,
    width: artwork.width,
    height: artwork.height,
    pushCommand,
    schedulePaintBump,
  });

  const { onArtworkPointerDown: onPaintPointerDown } = usePixelPainting({
    artwork,
    activeLayerId: layersState.activeLayer?.id ?? null,
    activeLayerVisible: layersState.activeLayer?.visible ?? true,
    activeLayerPixelData: layersState.activeLayer?.pixelData ?? null,
    viewport,
    canvasRef: artworkCanvasRef,
    activeSlot: paletteUi.activeSlot,
    primaryPaletteIndex: primaryPaint,
    secondaryPaletteIndex: secondaryPaint,
    onCommitStroke,
    onPixelsChanged: schedulePaintBump,
    deferPrimaryPaint,
    touchPointersRef,
    onHiddenActiveLayerPaintAttempt,
    bucketMode,
    eraserMode,
  });

  const { assignSwatchToSlot } = paletteUi;
  const onPick = useCallback(
    (slot: TColorSlot, paletteIndex: number) => {
      assignSwatchToSlot(slot, paletteIndex);
      runToolAction("pickApplied");
    },
    [assignSwatchToSlot, runToolAction],
  );

  // Registered after useEditorPointerContacts, like painting (docs/canvas-pointer-contract.md).
  const picker = useColorPickerHold({
    artwork,
    viewport,
    canvasRef: artworkCanvasRef,
    touchPointersRef,
    deferPrimaryPaint,
    armed: pickerArmed,
    activeSlot: paletteUi.activeSlot,
    onPick,
    onDisarm: togglePicker,
    panelOpen:
      paletteModalOpen || layersDrawerOpen || settingsDrawerOpen || pixelShift.shiftOverlayOpen,
  });

  /** The picker takes the press first; painting gets it only when the picker does not. */
  const onArtworkPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!picker.onPickPointerDown(e)) {
      onPaintPointerDown(e);
    }
  };

  /** While a pick hovers a color, the palette row marks and reveals that swatch. */
  const pickTarget = picker.hold?.target;
  const rowFocusedSwatchIndex =
    pickTarget?.kind === "color" ? pickTarget.paletteIndex : paletteUi.focusedSwatchIndex;

  return {
    artwork,
    paletteUi,
    primaryPaint,
    secondaryPaint,
    canUndo,
    canRedo,
    undo,
    redo,
    panMode,
    togglePanMode,
    bucketMode,
    toggleBucketMode,
    eraserMode,
    toggleEraserMode,
    pickerPressed: pickerArmed || picker.altHeld,
    togglePicker,
    pickHold: picker.hold,
    rowFocusedSwatchIndex,
    primaryColor: artwork.palette[primaryPaint],
    secondaryColor: artwork.palette[secondaryPaint],
    canZoomIn,
    canZoomOut,
    onZoomIn,
    onZoomOut,
    pixelShift,
    paletteModalOpen,
    openPaletteModal: () => setPaletteModalOpen(true),
    closePaletteModal: () => setPaletteModalOpen(false),
    canRemoveSwatch: artwork.palette.length > 1,
    maxPaletteReached: artwork.palette.length >= MAX_PALETTE_ENTRIES,
    wrapRef,
    artworkCanvasRef,
    referenceImageCanvasRef,
    gridCanvasRef,
    zoomPanHandlers,
    onArtworkPointerDown,
    layersState,
    layersDrawerOpen,
    toggleLayersDrawer: () => setLayersDrawerOpen((v) => !v),
    closeLayersDrawer: () => setLayersDrawerOpen(false),
    maxLayersReached: !canAddLayer(artwork.layers.length),
    addLayer: () => {
      layersState.addLayer();
    },
    settingsDrawerOpen,
    toggleSettingsDrawer: () => setSettingsDrawerOpen((v) => !v),
    closeSettingsDrawer: () => setSettingsDrawerOpen(false),
    handleApplyCanvasSize,
    viewport,
    cssSize,
    paintRevision,
    showPixelGrid,
    togglePixelGrid,
    referenceImage,
  };
}
