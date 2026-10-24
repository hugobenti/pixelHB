import type { IGalleryContent } from "./content.type";

export const gallery: IGalleryContent = {
  metaDescription:
    "Create, rename, clone, import and delete your pixel-art canvases. Everything is saved in this browser.",
  screen: {
    heading: "Your artworks",
    countLabel: (n) => (n === 1 ? "1 artwork" : `${n} artworks`),
    storageNote: "Saved in this browser only.",
    storageLink: "Learn more",
    importFile: "Import file",
    importLabel: "Import file (.json)",
    newArtwork: "New artwork",
    newCompact: "New",
  },
  grid: {
    emptyTitle: "No artworks yet",
    emptyText: "Create your first canvas, or open an artwork file you exported before.",
  },
  card: {
    clone: "Duplicate",
    size: (w, h) => `${w} × ${h}`,
    edited: (relative) => `Edited ${relative}`,
    justNow: "just now",
    metaSeparator: " · ",
    delete: "Delete",
    titleLabel: "Artwork title",
    actionsLabel: (title) => `Actions for ${title}`,
  },
  create: {
    title: "New artwork",
    titleLabel: "Title",
    backgroundLabel: "Background color",
    sizeLabel: "Canvas size",
    sizePresetsLabel: "Size presets",
    sizePresetLabel: (size) => `${size} × ${size} pixels`,
    hint: (max) =>
      `Up to ${max} × ${max} px. A background color not in the palette is added to it.`,
    submit: "Create",
    submitting: "Creating…",
  },
  import: {
    success: "Artwork imported.",
    failed: "This file isn’t a PixelHB artwork.",
  },
  errors: {
    load: "Couldn’t open your artworks. Reload the page to try again.",
    create: "Couldn’t create the artwork. Try again.",
    import: "This file isn’t a PixelHB artwork.",
    rename: "Couldn’t rename the artwork. Try again.",
    clone: "Couldn’t duplicate the artwork. Try again.",
    delete: "Couldn’t delete the artwork. Try again.",
  },
  toasts: {
    duplicated: "Artwork duplicated.",
  },
  deleteDialog: {
    title: (title) => `Delete “${title}”?`,
    description:
      "The artwork and all its layers are removed from this browser. This can’t be undone.",
    confirm: "Delete artwork",
  },
};
