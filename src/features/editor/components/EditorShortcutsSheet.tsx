"use client";

import Link from "next/link";

import { editor } from "@/content/editor";
import { help } from "@/content/help";
import { Modal } from "@/features/shared/components/Modal";
import { ShortcutKeys } from "@/features/shared/components/ShortcutKeys";
import { editorShortcutsSheet } from "./EditorShortcutsSheet.style";
import type { IEditorShortcutsSheetProps } from "./EditorShortcutsSheet.type";

export function EditorShortcutsSheet({ open, onClose }: IEditorShortcutsSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={help.shortcutsTitle}
      size="md"
      footer={
        <Link href="/help#shortcuts" className={editorShortcutsSheet.link}>
          {editor.toolbar.shortcutsHelp}
        </Link>
      }
    >
      <div className={editorShortcutsSheet.list}>
        {help.shortcutGroups.map((group) => (
          <section key={group.title} className={editorShortcutsSheet.group}>
            <h3 className={editorShortcutsSheet.groupTitle}>{group.title}</h3>
            {group.shortcuts.map((shortcut) => (
              <div key={shortcut.effect} className={editorShortcutsSheet.row}>
                <div>
                  <p className={editorShortcutsSheet.action}>{shortcut.action}</p>
                  {shortcut.note ? (
                    <p className={editorShortcutsSheet.note}>{shortcut.note}</p>
                  ) : null}
                </div>
                <span className={editorShortcutsSheet.key}>
                  <ShortcutKeys combo={shortcut.combo} />
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Modal>
  );
}
