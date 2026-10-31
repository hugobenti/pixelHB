/**
 * Purpose:
 * Pure layer-list edits that report "no change" as null, so hooks can decide whether an edit
 * happened from the current state instead of from inside a React state updater.
 */
import type { IArtworkLayer } from "@/features/shared/artwork/artwork.type";

export function moveLayerByIds(
  layers: IArtworkLayer[],
  activeId: string,
  overId: string,
): IArtworkLayer[] {
  const from = layers.findIndex((layer) => layer.id === activeId);
  const to = layers.findIndex((layer) => layer.id === overId);
  if (from < 0 || to < 0 || from === to) {
    return layers;
  }
  const next = [...layers];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Inserts `layer` directly above the active layer (layers[0] is topmost); at the top if the id is unknown. */
export function insertLayerAbove(
  layers: IArtworkLayer[],
  activeLayerId: string,
  layer: IArtworkLayer,
): IArtworkLayer[] {
  const index = Math.max(
    0,
    layers.findIndex((item) => item.id === activeLayerId),
  );
  const next = [...layers];
  next.splice(index, 0, layer);
  return next;
}

export function withToggledVisibility(
  layers: IArtworkLayer[],
  layerId: string,
): IArtworkLayer[] | null {
  if (!layers.some((layer) => layer.id === layerId)) {
    return null;
  }
  return layers.map((layer) =>
    layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
  );
}

export function withRenamedLayer(
  layers: IArtworkLayer[],
  layerId: string,
  name: string,
): IArtworkLayer[] | null {
  if (!layers.some((layer) => layer.id === layerId && layer.name !== name)) {
    return null;
  }
  return layers.map((layer) => (layer.id === layerId ? { ...layer, name } : layer));
}
