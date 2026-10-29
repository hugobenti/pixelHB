/**
 * Purpose:
 * LayersDrawer behavior: panel motion (useLayersDrawerPanel), the rename dialog session, the delete
 * confirmation, dnd-kit sensors and reorder on drop, and Escape that closes the rename dialog first,
 * then the drawer (an open delete confirmation catches Escape itself).
 */
"use client";

import { useEffect } from "react";

import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { editor } from "@/content/editor";
import { useLayerRenameDialog } from "@/features/editor/components/LayersDrawer/hooks/useLayerRenameDialog";
import { useLayersDrawerPanel } from "@/features/editor/components/LayersDrawer/useLayersDrawerPanel";
import { MAX_LAYERS } from "@/features/shared/artwork/artworkLimits";
import { useConfirm } from "@/features/shared/components/useConfirm";
import type { ILayersDrawerProps } from "./LayersDrawer.type";

export function useLayersDrawer({
  layers,
  maxLayersReached,
  onClose,
  onCopyLayer,
  onRenameLayer,
  onReorderLayers,
  onDeleteLayer,
}: ILayersDrawerProps) {
  const { panelEntered, handleClose } = useLayersDrawerPanel({ onClose });
  const { confirm, dialog: deleteDialog } = useConfirm();

  const layerRename = useLayerRenameDialog(onRenameLayer);
  const { session: renameSessionOpen, dismiss: dismissRename, requestRename } = layerRename;

  const handleRenameClick = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) {
      return;
    }
    requestRename(layerId, layer.name);
  };

  const handleDeleteClick = async (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) {
      return;
    }
    const { deleteDialog: copy } = editor.layers;
    const confirmed = await confirm({
      title: copy.title(layer.name),
      description: copy.description,
      confirmLabel: copy.confirm,
    });
    if (confirmed) {
      onDeleteLayer(layerId);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      // dnd-kit prevents the Escape that cancels a keyboard drag; that one must not close the drawer.
      if (event.key === "Escape" && !event.defaultPrevented) {
        if (renameSessionOpen) {
          dismissRename();
          return;
        }
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, renameSessionOpen, dismissRename]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) {
      return;
    }
    onReorderLayers(String(event.active.id), String(event.over.id));
  };

  return {
    panelEntered,
    handleClose,
    sensors,
    handleDragEnd,
    layerIds: layers.map((layer) => layer.id),
    handleRenameClick,
    /** Undefined while only one layer is left, which disables every row's delete button. */
    handleDeleteClick: layers.length > 1 ? handleDeleteClick : undefined,
    /** Undefined at the layer cap, which disables every row's duplicate button. */
    handleCopyClick: maxLayersReached ? undefined : onCopyLayer,
    limitNote: maxLayersReached ? editor.layers.limitReached(MAX_LAYERS) : null,
    deleteDialog,
    renameSession: layerRename.session,
    dismissRename,
    confirmRename: layerRename.confirm,
  };
}
