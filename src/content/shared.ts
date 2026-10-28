import type { ISharedContent } from "./content.type";

export const shared: ISharedContent = {
  loading: "Loading…",
  sync: {
    thisBrowserOnly: "Saved in this browser only.",
    syncing: "Syncing with your Google Drive…",
    saved: "Saved to your Drive.",
    offline: "Couldn’t reach Drive. Your work is saved on this device.",
    signInAgain: "Sign in again to keep syncing.",
    tooLarge: (count) =>
      count === 1
        ? "Too large to sync. Export it to keep a copy."
        : `${count} artworks are too large to sync. Export them to keep a copy.`,
    unconfirmed: (name) =>
      `Can’t confirm your account right now. Showing ${name ? `${name}’s` : "your"} drawings${name ? "" : " here"}; changes sync once we can.`,
    driveFull: "Your Google Drive is full. Free some space to keep syncing.",
    clockSkew: (count) =>
      count === 1
        ? "Your device clock looks wrong; this artwork isn’t syncing."
        : `Your device clock looks wrong; ${count} artworks aren’t syncing.`,
    missingInDrive: (count) =>
      count === 1
        ? "1 artwork isn’t in your Drive anymore. It’s kept on this device; delete it here if you don’t need it."
        : `${count} artworks aren’t in your Drive anymore. They’re kept on this device; delete them here if you don’t need them.`,
    driveFolderTrashed:
      "Your PixelHB folder is in the Drive trash. Your drawings are kept on this device; restore the folder in Drive to keep syncing.",
    conflictCopySuffix: " (conflict copy)",
    openDriveFolder: "Open PixelHB folder in Drive",
    opensInNewTab: "(opens in a new tab)",
  },
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
