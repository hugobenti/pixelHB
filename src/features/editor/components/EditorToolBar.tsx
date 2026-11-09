/**
 * Purpose:
 * Drawing tools: brush, eraser, bucket, picker, pan, shift, the color pair and zoom.
 *
 * Notes:
 * A bottom bar below `md` (zoom hidden there, pinch covers it), the right half of the top row from `md`.
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
    <div className={editorToolBar.bar}>
      <div className={editorToolBar.drawingGroup} role="group" aria-label={toolbar.toolsGroupLabel}>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.pencil}
            label={toolbar.brush.label}
            shortcut={toolbar.brush.shortcut}
            pressed={brushMode}
            className={editorToolBar.phoneButton}
            onClick={onSelectBrush}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.brush}
          </span>
        </div>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.eraser}
            label={toolbar.eraser.label}
            shortcut={toolbar.eraser.shortcut}
            pressed={eraserMode}
            className={editorToolBar.phoneButton}
            onClick={onToggleEraserMode}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.eraser}
          </span>
        </div>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.bucket}
            label={toolbar.bucket.label}
            shortcut={toolbar.bucket.shortcut}
            pressed={bucketMode}
            className={editorToolBar.phoneButton}
            onClick={onToggleBucketMode}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.bucket}
          </span>
        </div>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.pipette}
            label={toolbar.picker.label}
            shortcut={toolbar.picker.shortcut}
            pressed={pickerPressed}
            className={editorToolBar.phoneButton}
            onClick={onTogglePicker}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.picker}
          </span>
        </div>
      </div>
      <div className={editorToolBar.viewGroup} role="group" aria-label={toolbar.viewGroupLabel}>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.pan}
            label={toolbar.pan.label}
            shortcut={toolbar.pan.shortcut}
            pressed={panMode}
            className={editorToolBar.phoneButton}
            onClick={onTogglePanMode}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.pan}
          </span>
        </div>
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
      </div>
      <div className={editorToolBar.editGroup} role="group" aria-label={toolbar.editGroupLabel}>
        <div className={editorToolBar.phoneTool}>
          <IconButton
            icon={PUBLIC_ICONS.move}
            label={toolbar.shift.label}
            pressed={shiftOverlayOpen}
            className={editorToolBar.phoneButton}
            onClick={onToggleShiftOverlay}
          />
          <span aria-hidden="true" className={editorToolBar.phoneCaption}>
            {toolbar.phoneLabels.shift}
          </span>
        </div>
      </div>
      <div className={editorToolBar.colorGroup} role="group" aria-label={toolbar.colorsGroupLabel}>
        <ColorPairChip
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          activeSlot={activeSlot}
          onToggle={onToggleActiveSlot}
        />
      </div>
    </div>
  );
}
