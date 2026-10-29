/**
 * Purpose:
 * SortableLayerItem behavior: dnd-kit sortable wiring and drag style, the visibility toggle's label and
 * icon, row actions that don't also select the layer (delete is unavailable on the only layer,
 * duplicate at the layer cap), and
 * the preview key that redraws it on drawer open.
 */
"use client";

import type { MouseEvent } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { editor } from "@/content/editor";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import type { ISortableLayerItemProps } from "./SortableLayerItem.type";

/** Row opacity while it is being dragged. */
const DRAGGING_OPACITY = 0.65;

export function useSortableLayerItem({
  layer,
  onSelectLayer,
  onToggleVisibility,
  onCopyLayer,
  onRenameClick,
  onDeleteClick,
  drawerOpen,
}: ISortableLayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });

  return {
    attributes,
    listeners,
    setNodeRef,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? DRAGGING_OPACITY : 1,
    },
    previewKey: `${layer.id}-${drawerOpen ? "open" : "closed"}`,
    visibilityLabel: layer.visible ? editor.layers.item.hide : editor.layers.item.show,
    visibilityIcon: layer.visible ? PUBLIC_ICONS.eye : PUBLIC_ICONS.eyeOff,
    select: () => onSelectLayer(layer.id),
    toggleVisibility: (event: MouseEvent) => {
      event.stopPropagation();
      onToggleVisibility(layer.id);
    },
    canCopy: onCopyLayer !== undefined,
    copy: (event: MouseEvent) => {
      event.stopPropagation();
      onCopyLayer?.(layer.id);
    },
    rename: (event: MouseEvent) => {
      event.stopPropagation();
      onRenameClick(layer.id);
    },
    canDelete: onDeleteClick !== undefined,
    remove: (event: MouseEvent) => {
      event.stopPropagation();
      onDeleteClick?.(layer.id);
    },
  };
}
