/**
 * Purpose:
 * Interactive pixel editor: viewport, layered canvases, painting, undo/redo, overlays, and autosave.
 *
 * Notes:
 * useEditorWorkspace composes the editor hooks; this file only lays out toolbar, palette modal,
 * canvas, drawers, shift overlay and the color picker overlay.
 */
"use client";

import { CanvasContainer } from "@/features/editor/components/CanvasContainer";
import { ColorPickerOverlay } from "@/features/editor/components/ColorPickerOverlay";
import { ColorSelectionRow } from "@/features/editor/components/ColorSelectionRow";
import { EditorActionsBar } from "@/features/editor/components/EditorActionsBar";
import { EditorSettingsDrawer } from "@/features/editor/components/EditorSettingsDrawer";
import { LayersDrawer } from "@/features/editor/components/LayersDrawer";
import { PaletteEditModal } from "@/features/editor/components/PaletteEditModal";
import { ShiftDirectionOverlay } from "@/features/editor/components/ShiftDirectionOverlay";
import { editorWorkspace } from "./EditorWorkspace.style";
import type { IEditorWorkspaceProps } from "./EditorWorkspace.type";
import { useEditorWorkspace } from "./useEditorWorkspace";

export function EditorWorkspace(props: IEditorWorkspaceProps) {
  const {
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
    selectBrush,
    bucketMode,
    toggleBucketMode,
    eraserMode,
    toggleEraserMode,
    pickerPressed,
    togglePicker,
    pickHold,
    rowFocusedSwatchIndex,
    primaryColor,
    secondaryColor,
    canZoomIn,
    canZoomOut,
    onZoomIn,
    onZoomOut,
    pixelShift,
    paletteModalOpen,
    openPaletteModal,
    closePaletteModal,
    canRemoveSwatch,
    maxPaletteReached,
    wrapRef,
    artworkCanvasRef,
    referenceImageCanvasRef,
    gridCanvasRef,
    zoomPanHandlers,
    onArtworkPointerDown,
    layersState,
    layersDrawerOpen,
    toggleLayersDrawer,
    closeLayersDrawer,
    maxLayersReached,
    addLayer,
    onSwatchPick,
    settingsDrawerOpen,
    settingsInitialView,
    toggleSettingsDrawer,
    openExportDrawer,
    closeSettingsDrawer,
    handleApplyCanvasSize,
    viewport,
    cssSize,
    paintRevision,
    historyRevision,
    showPixelGrid,
    togglePixelGrid,
    referenceImage,
  } = useEditorWorkspace(props);

  return (
    <div className={editorWorkspace.shell}>
      <header className={editorWorkspace.chrome}>
        <EditorActionsBar
          title={artwork.title}
          artworkId={artwork.id}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activeSlot={paletteUi.activeSlot}
          onToggleActiveSlot={paletteUi.toggleActiveSlot}
          brushMode={!panMode && !bucketMode && !eraserMode && !pickerPressed}
          onSelectBrush={selectBrush}
          panMode={panMode}
          onTogglePanMode={togglePanMode}
          bucketMode={bucketMode}
          onToggleBucketMode={toggleBucketMode}
          eraserMode={eraserMode}
          onToggleEraserMode={toggleEraserMode}
          pickerPressed={pickerPressed}
          onTogglePicker={togglePicker}
          canZoomOut={canZoomOut}
          canZoomIn={canZoomIn}
          onZoomOut={onZoomOut}
          onZoomIn={onZoomIn}
          shiftOverlayOpen={pixelShift.shiftOverlayOpen}
          onToggleShiftOverlay={pixelShift.toggleShiftOverlay}
          activeLayer={layersState.activeLayer}
          palette={artwork.palette}
          width={artwork.width}
          height={artwork.height}
          historyRevision={historyRevision}
          layersDrawerOpen={layersDrawerOpen}
          onToggleLayersDrawer={toggleLayersDrawer}
          settingsDrawerOpen={settingsDrawerOpen}
          onOpenExport={openExportDrawer}
          onToggleSettingsDrawer={toggleSettingsDrawer}
        />
        <ColorSelectionRow
          palette={artwork.palette}
          primaryIndex={primaryPaint}
          secondaryIndex={secondaryPaint}
          activeSlot={paletteUi.activeSlot}
          focusedSwatchIndex={rowFocusedSwatchIndex}
          onSwatchPick={onSwatchPick}
          onOpenPaletteModal={openPaletteModal}
        />
      </header>

      <PaletteEditModal
        open={paletteModalOpen}
        onClose={closePaletteModal}
        palette={artwork.palette}
        focusedSwatchIndex={paletteUi.focusedSwatchIndex}
        onSelectSwatch={paletteUi.selectSwatchForEditing}
        onApplyHex={paletteUi.applyHexAtIndex}
        onAddColor={paletteUi.addColor}
        onRemoveSwatch={paletteUi.removeSwatchAtIndex}
        getColorUsage={paletteUi.getColorUsage}
        canRemoveSwatch={canRemoveSwatch}
        maxPaletteReached={maxPaletteReached}
      />

      <main className={editorWorkspace.main}>
        <CanvasContainer
          wrapRef={wrapRef}
          artworkCanvasRef={artworkCanvasRef}
          referenceImageCanvasRef={referenceImageCanvasRef}
          gridCanvasRef={gridCanvasRef}
          viewportHandlers={zoomPanHandlers}
          onArtworkPointerDown={onArtworkPointerDown}
        />
      </main>

      {layersDrawerOpen ? (
        <LayersDrawer
          layers={artwork.layers}
          activeLayerId={artwork.activeLayerId}
          palette={artwork.palette}
          width={artwork.width}
          height={artwork.height}
          onClose={closeLayersDrawer}
          onSelectLayer={layersState.setActiveLayerId}
          onToggleVisibility={layersState.toggleLayerVisibility}
          maxLayersReached={maxLayersReached}
          onAddLayer={addLayer}
          onCopyLayer={layersState.copyLayer}
          onDeleteLayer={layersState.deleteLayer}
          onRenameLayer={layersState.renameLayer}
          onReorderLayers={layersState.reorderLayers}
        />
      ) : null}

      {settingsDrawerOpen ? (
        <EditorSettingsDrawer
          artwork={artwork}
          initialView={settingsInitialView}
          onApplyCanvasSize={handleApplyCanvasSize}
          viewport={viewport}
          viewportCssWidth={cssSize.w}
          viewportCssHeight={cssSize.h}
          paintRevision={paintRevision}
          showPixelGrid={showPixelGrid}
          onToggleGrid={togglePixelGrid}
          showReferenceImage={referenceImage.showReferenceImage}
          hasReferenceImage={referenceImage.hasReferenceImage}
          onToggleReferenceImage={referenceImage.onToggleReferenceImage}
          onLoadReferenceImage={referenceImage.onLoadReferenceImage}
          onClose={closeSettingsDrawer}
        />
      ) : null}

      <ShiftDirectionOverlay
        open={pixelShift.shiftOverlayOpen}
        onClose={pixelShift.closeShiftOverlay}
        onShift={pixelShift.applyShift}
      />

      <ColorPickerOverlay
        hold={pickHold}
        artwork={artwork}
        viewport={viewport}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </div>
  );
}
