/**
 * Purpose:
 * Site header: logo, the main links, the theme button and the page's primary action; on phones the
 * links and the theme switch move into a bottom-sheet menu.
 */
"use client";

import Link from "next/link";

import { shell } from "@/content/shell";
import { BrandLogo } from "@/features/shared/brand/BrandLogo";
import { Button } from "@/features/shared/components/Button";
import { IconButton } from "@/features/shared/components/IconButton";
import { Modal } from "@/features/shared/components/Modal";
import { ThemeToggle } from "@/features/shared/components/ThemeToggle";
import { PUBLIC_ICONS } from "@/features/shared/constants/publicIcons";
import { cx } from "@/features/shared/utils/cx";
import { AccountControl } from "./AccountControl";
import { siteHeader } from "./SiteHeader.style";
import type { ISiteHeaderProps } from "./SiteShell.type";
import { useSiteHeader } from "./useSiteHeader";

export function SiteHeader({ primaryAction }: ISiteHeaderProps) {
  const { navItems, menuItems, menuOpen, openMenu, closeMenu, themeReady, themeButton } =
    useSiteHeader();

  const labels = (
    <>
      <span className={siteHeader.labelFull}>{primaryAction.label}</span>
      <span className={siteHeader.labelCompact}>{primaryAction.compactLabel}</span>
    </>
  );

  return (
    <header className={siteHeader.bar}>
      <div className={siteHeader.row}>
        <Link href="/" className={siteHeader.logo}>
          <BrandLogo />
        </Link>
        <nav aria-label={shell.nav.label} className={siteHeader.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cx(
                siteHeader.link,
                item.current ? siteHeader.linkState.current : siteHeader.linkState.other,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <span className={siteHeader.spacer} />
        <span className={cx(siteHeader.theme, !themeReady && siteHeader.themePending)}>
          <IconButton
            icon={themeButton.icon}
            label={themeButton.label}
            onClick={themeButton.onClick}
          />
        </span>
        <AccountControl placement="bar" />
        {primaryAction.kind === "link" ? (
          <Link href={primaryAction.href} className={siteHeader.primary}>
            {labels}
          </Link>
        ) : (
          <Button
            type="button"
            onClick={primaryAction.onClick}
            className={siteHeader.primaryButton}
          >
            {labels}
          </Button>
        )}
        <IconButton
          icon={PUBLIC_ICONS.menu}
          label={shell.menu.open}
          onClick={openMenu}
          className={siteHeader.menuButton}
        />
      </div>
      <Modal open={menuOpen} onClose={closeMenu} title={shell.menu.title} size="sm">
        <nav aria-label={shell.nav.label} className={siteHeader.menuList}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={item.current ? "page" : undefined}
              className={cx(
                siteHeader.menuRow,
                item.current ? siteHeader.menuRowState.current : siteHeader.menuRowState.other,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <AccountControl placement="sheet" />
        <ThemeToggle variant="row" className={siteHeader.menuTheme} />
      </Modal>
    </header>
  );
}
