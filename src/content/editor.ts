import type { IEditorContent } from "./content.type";
import { site } from "./site";

export const editor: IEditorContent = {
  route: {
    missingId: "Missing artwork id.",
  },
  screen: {
    notFound: "Artwork not found.",
    loadFailed: "This artwork couldn’t be opened. Your browser’s storage may be blocked or full. Try again in a moment.",
    documentTitle: (artworkTitle) => `${artworkTitle} · ${site.name}`,
    backToGallery: "Back to gallery",
    loading: "Loading artwork…",
  },
  viewport: {
    label: "Pixel canvas (arrow keys pan, Shift for larger steps)",
  },
  toolbar: {
    back: "Gallery",
    groupLabel: "Editor tools",
    undo: { label: "Undo", shortcut: "Ctrl+Z" },
    redo: { label: "Redo", shortcut: "Ctrl+Shift+Z" },
    pan: { label: "Pan mode", shortcut: "hold Space" },
    bucket: { label: "Paint bucket mode" },
    picker: { label: "Color picker", shortcut: "hold Alt" },
    zoomOut: { label: "Zoom out" },
    zoomIn: { label: "Zoom in" },
    shift: { label: "Shift pixels" },
    layers: { label: "Layers" },
    settings: { label: "Editor settings" },
    slot: {
      primary: "Primary",
      secondary: "Secondary",
      label: (slot) => `Painting slot: ${slot}. Click to switch.`,
      title: "Switch primary / secondary painting slot",
    },
  },
  paletteRow: {
    groupLabel: "Palette colors",
    edit: "Edit palette",
  },
  picker: {
    releaseToCancel: "Release to cancel",
  },
  paletteModal: {
    title: "Edit palette",
    swatches: "Swatches",
    selectedColor: "Selected color",
    selectedColorLabel: "Color value for selected swatch",
    addColor: "Add new color",
    newColorLabel: "Pick new color to append",
    addButton: "Add color",
    paletteFull: "Palette full (256 colors maximum).",
    colorExists: "This color is already in the palette.",
  },
  shiftOverlay: {
    closeLabel: "Close shift controls",
    dialogLabel: "Shift pixels",
    groupLabel: "Shift directions",
    directions: {
      up: { title: "Shift up (wrap)", label: "Shift pixels up" },
      left: { title: "Shift left (wrap)", label: "Shift pixels left" },
      right: { title: "Shift right (wrap)", label: "Shift pixels right" },
      down: { title: "Shift down (wrap)", label: "Shift pixels down" },
    },
  },
  settings: {
    titles: {
      menu: "Settings",
      canvasSize: "Canvas size",
      imageDetail: "Image detail",
      importExport: "Export",
    },
    backLabel: "Back to settings",
    closeLabel: "Close settings",
    navLabel: "Editor settings",
    menu: {
      grid: { label: "Pixel grid" },
      referenceImage: {
        label: "Reference image",
        unavailable: "Load an image first",
      },
      loadImage: { label: "Load image", hint: "Pick file" },
      canvasSize: { label: "Canvas size", hint: (width, height) => `${width} × ${height}` },
      export: { label: "Export", hint: "Download files" },
      imageDetail: { label: "Image detail", hint: "Visible area" },
    },
    canvasSize: {
      hint: "Pixels stay anchored to the top-left. New cells use the lightest palette color. Undo history for this artwork is cleared after the size changes.",
    },
    imageDetail: {
      noIntersection: "No artwork pixels intersect the visible viewport.",
      summary: (compositePixels, visibleCells) =>
        `${compositePixels} composited pixel${compositePixels === 1 ? "" : "s"} across ${visibleCells} visible cell${visibleCells === 1 ? "" : "s"} (layers stacked; no double counting).`,
      emptyViewport: "Pan or zoom so the canvas viewport overlaps your artwork.",
      allTransparent: "Every visible cell is fully transparent in the composite stack.",
      paletteEntry: (index) => `Color ${index + 1}`,
      percent: (value) => `${value}%`,
    },
    export: {
      hint: "Export a snapshot of the current artwork as PNG or export the full editable document as JSON.",
      sectionLabel: "Export document",
      title: "Export",
      png: "Export PNG",
      json: "Export JSON",
      jsonDone: "JSON file exported.",
      pngDone: "PNG file exported.",
      pngFailed: "Failed to export PNG.",
    },
  },
  layers: {
    title: "Layers",
    closeLabel: "Close layers panel",
    add: "Add layer",
    footer: "Top items render in front of lower items.",
    copyName: (name) => `${name} copy`,
    newLayerName: (position) => `Layer ${position}`,
    item: {
      dragTitle: "Drag to reorder (on touch: hold briefly, then drag)",
      reorder: "Reorder layer",
      show: "Show layer",
      hide: "Hide layer",
      duplicate: "Duplicate layer",
      rename: "Rename layer",
      delete: "Delete layer",
    },
    renameModal: {
      title: "Rename layer",
      nameLabel: "Layer name",
      emptyError: "Name can't be empty.",
    },
    deleteDialog: {
      title: (name) => `Delete “${name}”?`,
      description: "The layer and all its pixels are removed. This can’t be undone.",
      confirm: "Delete layer",
    },
  },
  toasts: {
    hiddenLayer: "The active layer is hidden. Show the layer to paint.",
  },
  referenceImage: {
    errors: {
      read: "Could not read the selected image.",
      decode: "Could not decode reference image.",
      canvas: "Could not prepare reference image canvas.",
    },
  },
  canvasShrinkDialog: {
    title: (width, height) => `Crop canvas to ${width} × ${height}?`,
    description: (width, height) =>
      `Pixels outside the top-left ${width} × ${height} area are deleted from every layer.`,
    warning: "Undo history for this artwork is cleared too, so the crop can’t be undone.",
    confirm: "Crop canvas",
  },
  paletteRemoval: {
    /** Undo toast after a palette color is removed. */
    removed: (color) => `Removed color ${color}.`,
    dialog: {
      title: (color) => `Remove ${color}?`,
      description: (pixelCount) =>
        `${pixelCount === 1 ? "1 pixel uses" : `${pixelCount} pixels use`} this color. Pick what ${pixelCount === 1 ? "it becomes" : "they become"}; Undo brings the color back.`,
      replaceWith: "Replace with",
      transparent: "Transparent",
      confirm: "Remove color",
    },
  },
};
