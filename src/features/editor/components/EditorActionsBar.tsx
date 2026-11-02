/**
 * Purpose:
 * Top row: navigation, document title, sync status, undo/redo, the active-layer chip, export and settings.
 *
 * Notes:
 * Drawing tools live in EditorToolBar. Toggles use IconButton's pressed state, never the accent.
 */
"use client";

import Link from "next/link";

import { editor } from "@/content/editor";
import { IconButton } from "@/features/shared/components/IconButton";
import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { ActiveLayerChip } from "./ActiveLayerChip";
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
          <span className={editorActionsBar.backLabel}>{toolbar.back}</span>
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
