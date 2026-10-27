/**
 * Purpose:
 * Manage editor layer behavior (active layer selection, visibility toggles, ordering updates,
 * duplication and deletion).
 */
"use client";

import { useCallback, useMemo } from "react";
import { editor } from "@/content/editor";
import {
  moveLayerByIds,
  withRenamedLayer,
  withToggledVisibility,
} from "@/features/editor/logic/layerEdits";
import { removeLayer } from "@/features/editor/logic/layerRemoval";
import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";
import { TRANSPARENT_PIXEL_INDEX } from "@/features/shared/artwork/artworkService";
import { clonePixelBuffer } from "@/features/shared/utils/binaryHelpers";
import type { IUseArtworkLayersParams } from "./useArtworkLayers.type";

export function useArtworkLayers({
  artwork,
  setArtwork,
  onLayersChanged,
}: IUseArtworkLayersParams) {
  const layers = artwork.layers;

  const activeLayer = useMemo(
    () =>
      layers.find((layer) => layer.id === artwork.activeLayerId) ??
      layers[0] ??
      null,
    [layers, artwork.activeLayerId]
  );

  const visibleLayers = useMemo(
    () => layers.filter((layer) => layer.visible),
    [layers]
  );

  const setActiveLayerId = useCallback(
    (layerId: string) => {
      if (
        artwork.activeLayerId === layerId ||
        !artwork.layers.some((layer) => layer.id === layerId)
      ) {
        return;
      }
      setArtwork((prev) =>
        prev.activeLayerId === layerId ||
        !prev.layers.some((layer) => layer.id === layerId)
          ? prev
          : { ...prev, activeLayerId: layerId }
      );
      onLayersChanged();
    },
    [artwork.activeLayerId, artwork.layers, setArtwork, onLayersChanged]
  );

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      if (!withToggledVisibility(layers, layerId)) {
        return;
      }
      setArtwork((prev) => {
        const nextLayers = withToggledVisibility(prev.layers, layerId);
        return nextLayers ? { ...prev, layers: nextLayers } : prev;
      });
      onLayersChanged();
    },
    [layers, setArtwork, onLayersChanged]
  );

  const reorderLayers = useCallback(
    (activeId: string, overId: string | null) => {
      if (!overId || moveLayerByIds(layers, activeId, overId) === layers) {
        return;
      }
      setArtwork((prev) => {
        const nextLayers = moveLayerByIds(prev.layers, activeId, overId);
        return nextLayers === prev.layers ? prev : { ...prev, layers: nextLayers };
      });
      onLayersChanged();
    },
    [layers, setArtwork, onLayersChanged]
  );

  const addLayer = useCallback(() => {
    let createdLayerId = "";
    setArtwork((prev) => {
      const pixelCount = prev.width * prev.height;
      const nextLayer: IArtworkLayer = {
        id: crypto.randomUUID(),
        name: editor.layers.newLayerName(prev.layers.length + 1),
        visible: true,
        pixelData: new Uint8Array(pixelCount),
      };
      nextLayer.pixelData.fill(TRANSPARENT_PIXEL_INDEX);
      createdLayerId = nextLayer.id;
      return {
        ...prev,
        layers: [...prev.layers, nextLayer],
        activeLayerId: nextLayer.id,
      };
    });
    onLayersChanged();
    return createdLayerId;
  }, [setArtwork, onLayersChanged]);

  const copyLayer = useCallback(
    (layerId: string) => {
      if (!layers.some((layer) => layer.id === layerId)) {
        return;
      }
      setArtwork((prev) => {
        const idx = prev.layers.findIndex((layer) => layer.id === layerId);
        if (idx < 0) {
          return prev;
        }
        const source = prev.layers[idx];
        const duplicated: IArtworkLayer = {
          id: crypto.randomUUID(),
          name: editor.layers.copyName(source.name),
          visible: source.visible,
          pixelData: clonePixelBuffer(source.pixelData),
        };
        const nextLayers = [...prev.layers];
        nextLayers.splice(idx, 0, duplicated);
        return {
          ...prev,
          layers: nextLayers,
          activeLayerId: duplicated.id,
        };
      });
      onLayersChanged();
    },
    [layers, setArtwork, onLayersChanged]
  );

  /** Deletes a layer; the last remaining layer can't be deleted. */
  const deleteLayer = useCallback(
    (layerId: string) => {
      if (!removeLayer(layers, artwork.activeLayerId, layerId)) {
        return;
      }
      setArtwork((prev) => {
        const result = removeLayer(prev.layers, prev.activeLayerId, layerId);
        return result
          ? { ...prev, layers: result.layers, activeLayerId: result.activeLayerId }
          : prev;
      });
      onLayersChanged();
    },
    [layers, artwork.activeLayerId, setArtwork, onLayersChanged]
  );

  const renameLayer = useCallback(
    (layerId: string, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed || !withRenamedLayer(layers, layerId, trimmed)) {
        return;
      }
      setArtwork((prev) => {
        const nextLayers = withRenamedLayer(prev.layers, layerId, trimmed);
        return nextLayers ? { ...prev, layers: nextLayers } : prev;
      });
      onLayersChanged();
    },
    [layers, setArtwork, onLayersChanged]
  );

  const withUpdatedActiveLayerPixels = useCallback(
    (updater: (pixelData: Uint8Array, layerId: string) => boolean) => {
      const current = activeLayer;
      if (!current) {
        return false;
      }
      const nextPixels = clonePixelBuffer(current.pixelData);
      const changed = updater(nextPixels, current.id);
      if (!changed) {
        return false;
      }
      setArtwork((prev) => ({
        ...prev,
        layers: prev.layers.map((layer) =>
          layer.id === current.id ? { ...layer, pixelData: nextPixels } : layer
        ),
      }));
      return true;
    },
    [activeLayer, setArtwork]
  );

  return {
    layers,
    visibleLayers,
    activeLayer,
    setActiveLayerId,
    toggleLayerVisibility,
    reorderLayers,
    addLayer,
    copyLayer,
    deleteLayer,
    renameLayer,
    withUpdatedActiveLayerPixels,
  };
}
