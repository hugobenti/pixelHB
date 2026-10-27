import type { ISharedContent } from "./content.type";

export const shared: ISharedContent = {
  loading: "Loading…",
  actions: {
    save: "Save",
    cancel: "Cancel",
    apply: "Apply",
    close: "Close",
    add: "Add",
    remove: "Remove",
    rename: "Rename",
  },
  fields: {
    width: "Width (px)",
    height: "Height (px)",
  },
  toast: {
    dismissLabel: "Dismiss notification",
  },
  sideDrawer: {
    closeLabel: "Close panel",
  },
  iconButton: {
    titleWithShortcut: (label, shortcut) => `${label} (${shortcut})`,
  },
  modal: {
    backdropLabel: "Close dialog",
  },
  numberField: {
    range: (min, max) => `Enter a whole number from ${min} to ${max}.`,
  },
  colorField: {
    pickerLabel: (label) => `${label}: color picker`,
    invalid: "Enter a hex color as #RRGGBB.",
  },
  theme: {
    label: "Theme",
    options: { light: "Light", dark: "Dark" },
  },
  colorSwatch: {
    compactTitle: (position) => `Color ${position}`,
    comfortableTitle: (position) => `Palette ${position}`,
    selectLabel: (position, color, slots = {}) =>
      `Select palette color ${position} (${color})${slots.primary ? ", primary" : ""}${slots.secondary ? ", secondary" : ""}`,
  },
  artwork: {
    untitled: "Untitled",
    backgroundLayer: "Background",
    copyTitle: (title) => `${title} (copy)`,
    errors: {
      dimensionsOutOfRange: (max) => `Dimensions must be between 1 and ${max}.`,
      invalidBackgroundColor: "Invalid background color.",
      backgroundPaletteFull: "Cannot add background color: palette is full.",
      importedPaletteEmpty: "Imported palette is empty.",
      paletteTooLarge: (max) => `Palette cannot exceed ${max} colors.`,
    },
  },
  artworkFile: {
    errors: {
      invalidFormat: "Invalid file format.",
      canvasUnavailable: "Unable to initialize canvas context.",
      invalidJson: "File is not valid JSON.",
    },
  },
};
