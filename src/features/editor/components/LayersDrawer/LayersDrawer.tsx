/**
 * Purpose:
 * Right-side animated drawer to inspect, reorder, hide/show, and select artwork layers.
 *
 * Notes:
 * Shell uses shared SideDrawer; layer list/DnD markup stays here; behavior in useLayersDrawer.
 */
"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { editor } from "@/content/editor";
import { Button } from "@/features/shared/components/Button";
import { ConfirmDialog } from "@/features/shared/components/ConfirmDialog";
import { SideDrawer, SideDrawerCloseButton } from "@/features/shared/components/SideDrawer";

import { ANIMATION_MS } from "@/features/editor/components/LayersDrawer/layersDrawer.constants";
import { LayerRenameModal } from "@/features/editor/components/LayersDrawer/LayerRenameModal";
import { SortableLayerItem } from "@/features/editor/components/LayersDrawer/SortableLayerItem";
import { layersDrawer } from "./LayersDrawer.style";
import type { ILayersDrawerProps } from "./LayersDrawer.type";
import { useLayersDrawer } from "./useLayersDrawer";

export function LayersDrawer(props: ILayersDrawerProps) {
  const {
    layers,
    activeLayerId,
    palette,
    width,
    height,
    onSelectLayer,
    onToggleVisibility,
    maxLayersReached,
    onAddLayer,
  } = props;
  const {
    panelEntered,
    handleClose,
    sensors,
    handleDragEnd,
    layerIds,
    handleRenameClick,
    handleDeleteClick,
    handleCopyClick,
    limitNote,
    deleteDialog,
    renameSession,
    dismissRename,
    confirmRename,
  } = useLayersDrawer(props);

  return (
    <>
      <SideDrawer
        entered={panelEntered}
        onBackdropClick={handleClose}
        title={editor.layers.title}
        motionDurationMs={ANIMATION_MS}
        backdropAriaLabel={editor.layers.closeLabel}
        headerRight={
          <SideDrawerCloseButton onClick={handleClose} aria-label={editor.layers.closeLabel} />
        }
        belowHeader={
          <div className={layersDrawer.actionsRow}>
            <Button
              type="button"
              variant="primary"
              className={layersDrawer.addButton}
              disabled={maxLayersReached}
              onClick={onAddLayer}
            >
              {editor.layers.add}
            </Button>
            {limitNote ? <p className={layersDrawer.limitNote}>{limitNote}</p> : null}
          </div>
        }
        footer={<footer className={layersDrawer.footer}>{editor.layers.footer}</footer>}
      >
        <div className={layersDrawer.listWrap}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={layerIds} strategy={verticalListSortingStrategy}>
              <ul className={layersDrawer.list}>
                {layers.map((layer) => (
                  <SortableLayerItem
                    key={layer.id}
                    layer={layer}
                    isActive={layer.id === activeLayerId}
                    palette={palette}
                    width={width}
                    height={height}
                    onSelectLayer={onSelectLayer}
                    onToggleVisibility={onToggleVisibility}
                    onCopyLayer={handleCopyClick}
                    onRenameClick={handleRenameClick}
                    onDeleteClick={handleDeleteClick}
                    drawerOpen={panelEntered}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </SideDrawer>

      <LayerRenameModal
        session={renameSession}
        onDismiss={dismissRename}
        onConfirm={confirmRename}
      />
      <ConfirmDialog {...deleteDialog} />
    </>
  );
}
