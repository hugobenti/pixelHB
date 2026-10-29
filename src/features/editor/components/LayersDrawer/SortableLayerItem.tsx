/**
 * Purpose:
 * One reorderable layer row: grip, preview, name, visibility, duplicate, rename, and delete actions.
 */
"use client";

import { editor } from "@/content/editor";
import { IconButton } from "@/features/shared/components/IconButton";
import { PublicMaskIcon } from "@/features/shared/components/PublicMaskIcon";
import { cx } from "@/features/shared/utils/cx";

import { LayerPreview } from "@/features/editor/components/LayersDrawer/LayerPreview";
import { LAYER_ICON_SRC } from "@/features/editor/components/LayersDrawer/layersDrawer.constants";
import { sortableLayerItem } from "./SortableLayerItem.style";
import type { ISortableLayerItemProps } from "./SortableLayerItem.type";
import { useSortableLayerItem } from "./useSortableLayerItem";

export function SortableLayerItem(props: ISortableLayerItemProps) {
  const { layer, isActive, palette, width, height } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    style,
    previewKey,
    visibilityLabel,
    visibilityIcon,
    select,
    toggleVisibility,
    canCopy,
    copy,
    rename,
    canDelete,
    remove,
  } = useSortableLayerItem(props);

  return (
    <li ref={setNodeRef} style={style} className={sortableLayerItem.wrap}>
      <div
        className={cx(
          sortableLayerItem.row,
          isActive ? sortableLayerItem.rowState.active : sortableLayerItem.rowState.idle,
        )}
      >
        <span
          className={sortableLayerItem.dragHandle}
          {...attributes}
          {...listeners}
          title={editor.layers.item.dragTitle}
        >
          <span className={sortableLayerItem.srOnly}>{editor.layers.item.reorder}</span>
          <PublicMaskIcon src={LAYER_ICON_SRC.grip} />
        </span>
        <button
          type="button"
          className={sortableLayerItem.selectButton}
          onClick={select}
          aria-pressed={isActive}
        >
          <span className={sortableLayerItem.previewWrap}>
            <LayerPreview
              key={previewKey}
              layer={layer}
              palette={palette}
              width={width}
              height={height}
            />
          </span>
          <span className={sortableLayerItem.metadata}>
            <span className={sortableLayerItem.layerName}>{layer.name}</span>
          </span>
        </button>
        <div className={sortableLayerItem.actions}>
          <IconButton icon={visibilityIcon} label={visibilityLabel} onClick={toggleVisibility} />
          <IconButton
            icon={LAYER_ICON_SRC.copy}
            label={editor.layers.item.duplicate}
            disabled={!canCopy}
            onClick={copy}
          />
          <IconButton
            icon={LAYER_ICON_SRC.pencil}
            label={editor.layers.item.rename}
            onClick={rename}
          />
          <IconButton
            icon={LAYER_ICON_SRC.trash}
            label={editor.layers.item.delete}
            disabled={!canDelete}
            onClick={remove}
          />
        </div>
      </div>
    </li>
  );
}
