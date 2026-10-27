import type { ReactNode } from "react";

export interface IConfirmOptions {
  /** Names the target, e.g. Delete “Slime”? */
  title: string;
  description: string;
  /** Irreversible consequence, shown as a highlighted note above the buttons. */
  warning?: string;
  confirmLabel: string;
}

export interface IConfirmDialogAction {
  label: string;
  onClick: () => void;
}

export interface IConfirmDialogProps {
  /** The open request, or null while the dialog is closed. */
  options: IConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
  /** An action is running: every button is shown disabled (kept focusable, so focus is not lost) and its handler is ignored by the caller. */
  busy?: boolean;
  /** An outline button between Cancel and the confirm button, for a third choice (e.g. download first). */
  extraAction?: IConfirmDialogAction;
  /** Extra controls between the description and the buttons (e.g. a choice the confirm applies). */
  children?: ReactNode;
}
