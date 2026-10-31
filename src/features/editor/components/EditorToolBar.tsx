/**
 * Purpose:
 * Drawing tools: brush, eraser, bucket, picker, pan, shift, the color pair and zoom.
 *
 * Notes:
 * A bottom bar below `sm` (zoom hidden there, pinch covers it), the right half of the top row from `sm`.
 * Toggles use IconButton's pressed state; the color-pair chip is a neutral outline button (never the accent).
 */
"use client";

import { editor } from "@/content/editor";
import { IconButton } from "@/features/shared/components/IconButton";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { ColorPairChip } from "./ColorPairChip";
import { editorToolBar } from "./EditorToolBar.style";
import type { IEditorToolBarProps } from "./EditorToolBar.type";

export function EditorToolBar({
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
}: IEditorToolBarProps) {
  const { toolbar } = editor;

  return (
    <div className={editorToolBar.bar} role="group" aria-label={toolbar.toolsGroupLabel}>
      <IconButton
        icon={PUBLIC_ICONS.pencil}
        label={toolbar.brush.label}
        shortcut={toolbar.brush.shortcut}
        pressed={brushMode}
        onClick={onSelectBrush}
      />
      <IconButton
        icon={PUBLIC_ICONS.eraser}
        label={toolbar.eraser.label}
        shortcut={toolbar.eraser.shortcut}
        pressed={eraserMode}
        onClick={onToggleEraserMode}
      />
      <IconButton
        icon={PUBLIC_ICONS.bucket}
        label={toolbar.bucket.label}
        shortcut={toolbar.bucket.shortcut}
        pressed={bucketMode}
        onClick={onToggleBucketMode}
      />
      <IconButton
        icon={PUBLIC_ICONS.pipette}
        label={toolbar.picker.label}
        shortcut={toolbar.picker.shortcut}
        pressed={pickerPressed}
        onClick={onTogglePicker}
      />
      <IconButton
        icon={PUBLIC_ICONS.pan}
        label={toolbar.pan.label}
        shortcut={toolbar.pan.shortcut}
        pressed={panMode}
        onClick={onTogglePanMode}
      />
      <IconButton
        icon={PUBLIC_ICONS.zoomOut}
        label={toolbar.zoomOut.label}
        shortcut={toolbar.zoomOut.shortcut}
        className={editorToolBar.zoomButton}
        disabled={!canZoomOut}
        onClick={onZoomOut}
      />
      <IconButton
        icon={PUBLIC_ICONS.zoomIn}
        label={toolbar.zoomIn.label}
        shortcut={toolbar.zoomIn.shortcut}
        className={editorToolBar.zoomButton}
        disabled={!canZoomIn}
        onClick={onZoomIn}
      />
      <IconButton
        icon={PUBLIC_ICONS.move}
        label={toolbar.shift.label}
        pressed={shiftOverlayOpen}
        onClick={onToggleShiftOverlay}
      />
      <ColorPairChip
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        activeSlot={activeSlot}
        onToggle={onToggleActiveSlot}
      />
    </div>
  );
}
