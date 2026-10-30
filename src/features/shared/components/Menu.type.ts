export interface IMenuItem {
  /** Stable key for the action. */
  key: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "danger";
}

export interface IMenuProps {
  /** Accessible name of the menu trigger. */
  label: string;
  /** Heading of the bottom sheet shown on phones. */
  sheetTitle: string;
  items: readonly IMenuItem[];
  /** Called whenever the menu (popover or phone sheet) opens or closes. */
  onOpenChange?: (open: boolean) => void;
}
