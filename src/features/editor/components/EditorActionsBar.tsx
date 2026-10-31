/**
 * Purpose:
 * Single toolbar row: navigation, document title, icon toolbar (undo/redo/pan/zoom/… ), and settings (drawer).
 *
 * Notes:
 * Toggles use IconButton's pressed state; the color-pair chip is a neutral outline button (never the accent).
 */
"use client";

import Link from "next/link";

import { editor } from "@/content/editor";
import { IconButton } from "@/features/shared/components/IconButton";
import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { ActiveLayerChip } from "./ActiveLayerChip";
import { ColorPairChip } from "./ColorPairChip";
import { editorActionsBar } from "./EditorActionsBar.style";
import type { IEditorActionsBarProps } from "./EditorActionsBar.type";
import { useEditorActionsBar } from "./useEditorActionsBar";

export function EditorActionsBar(props: IEditorActionsBarProps) {
  const {
    title,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    primaryColor,
    secondaryColor,
    activeSlot,
    onToggleActiveSlot,
    brushMode,
    onSelectBrush,
    panMode,
    onTogglePanMode,
    bucketMode,
    onToggleBucketMode,
    eraserMode,
    onToggleEraserMode,
    pickerPressed,
    onTogglePicker,
    canZoomOut,
    canZoomIn,
    onZoomOut,
    onZoomIn,
    shiftOverlayOpen,
    onToggleShiftOverlay,
    activeLayer,
    palette,
    width,
    height,
    historyRevision,
    layersDrawerOpen,
    onToggleLayersDrawer,
    onOpenExport,
    settingsDrawerOpen,
    onToggleSettingsDrawer,
  } = props;
  const { syncStatus } = useEditorActionsBar(props);
  const { toolbar } = editor;

  return (
    <div className={editorActionsBar.bar}>
      <div className={editorActionsBar.leftCluster}>
        <Link href="/gallery" className={editorActionsBar.backLink}>
          <PublicMaskIcon src={PUBLIC_ICONS.chevronLeft} />
          {toolbar.back}
        </Link>
        <h1 className={editorActionsBar.heading}>{title}</h1>
        {syncStatus ? (
          <p className={editorActionsBar.status[syncStatus.tone]}>{syncStatus.text}</p>
        ) : null}
      </div>
      <div className={editorActionsBar.actions} role="group" aria-label={toolbar.groupLabel}>
        <IconButton
          icon={PUBLIC_ICONS.undo}
          label={toolbar.undo.label}
          shortcut={toolbar.undo.shortcut}
          disabled={!canUndo}
          onClick={onUndo}
        />
        <IconButton
          icon={PUBLIC_ICONS.redo}
          label={toolbar.redo.label}
          shortcut={toolbar.redo.shortcut}
          disabled={!canRedo}
          onClick={onRedo}
        />
        <IconButton
          icon={PUBLIC_ICONS.pencil}
          label={toolbar.brush.label}
          shortcut={toolbar.brush.shortcut}
          pressed={brushMode}
          onClick={onSelectBrush}
        />
        <IconButton
          icon={PUBLIC_ICONS.pan}
          label={toolbar.pan.label}
          shortcut={toolbar.pan.shortcut}
          pressed={panMode}
          onClick={onTogglePanMode}
        />
        <IconButton
          icon={PUBLIC_ICONS.bucket}
          label={toolbar.bucket.label}
          shortcut={toolbar.bucket.shortcut}
          pressed={bucketMode}
          onClick={onToggleBucketMode}
        />
        <IconButton
          icon={PUBLIC_ICONS.eraser}
          label={toolbar.eraser.label}
          shortcut={toolbar.eraser.shortcut}
          pressed={eraserMode}
          onClick={onToggleEraserMode}
        />
        <IconButton
          icon={PUBLIC_ICONS.pipette}
          label={toolbar.picker.label}
          shortcut={toolbar.picker.shortcut}
          pressed={pickerPressed}
          onClick={onTogglePicker}
        />
        <IconButton
          icon={PUBLIC_ICONS.zoomOut}
          label={toolbar.zoomOut.label}
          shortcut={toolbar.zoomOut.shortcut}
          disabled={!canZoomOut}
          onClick={onZoomOut}
        />
        <IconButton
          icon={PUBLIC_ICONS.zoomIn}
          label={toolbar.zoomIn.label}
          shortcut={toolbar.zoomIn.shortcut}
          disabled={!canZoomIn}
          onClick={onZoomIn}
        />
        <IconButton
          icon={PUBLIC_ICONS.move}
          label={toolbar.shift.label}
          pressed={shiftOverlayOpen}
          onClick={onToggleShiftOverlay}
        />
        {activeLayer ? (
          <ActiveLayerChip
            layer={activeLayer}
            palette={palette}
            width={width}
            height={height}
            revision={historyRevision}
            pressed={layersDrawerOpen}
            onClick={onToggleLayersDrawer}
          />
        ) : null}
        <ColorPairChip
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activeSlot={activeSlot}
          onToggle={onToggleActiveSlot}
        />
        <IconButton
          icon={PUBLIC_ICONS.download}
          label={toolbar.export.label}
          onClick={onOpenExport}
        />
        <IconButton
          icon={PUBLIC_ICONS.cog}
          label={toolbar.settings.label}
          pressed={settingsDrawerOpen}
          onClick={onToggleSettingsDrawer}
        />
      </div>
    </div>
  );
}
