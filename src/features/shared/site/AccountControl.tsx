/**
 * Purpose:
 * Header account control: a "Sign in with Google" button when signed out, a monogram avatar with a
 * disclosure panel (name, email, sync status, Drive folder link, sign out) when signed in. Renders
 * nothing in a browser that cannot sync (no Web Locks).
 *
 * Notes:
 * `bar` sits in the header row from `sm` up; `sheet` is an inline section of the phone menu, with no
 * popover. When the Google sign-in expired, the panel shows a note and "Sign in with Google" again.
 * Both sign-in buttons are Google-branded (Google's "G" from public/brand/google-g.svg, unaltered;
 * classes and the guideline values in AccountControl.style.ts); the "G" is decorative, so the
 * button's accessible name is its text.
 */
"use client";

import Image from "next/image";

import { shared } from "@/content/shared";
import { shell } from "@/content/shell";
import { Button } from "@/features/shared/components/Button";
import { ConfirmDialog } from "@/features/shared/components/ConfirmDialog";
import { cx } from "@/features/shared/utils/cx";
import { accountControl } from "./AccountControl.style";
import type { IAccountControlProps } from "./AccountControl.type";
import { useAccountControl } from "./useAccountControl";

export function AccountControl({ placement }: IAccountControlProps) {
  const {
    account,
    hidden,
    syncStatusText,
    driveFolderUrl,
    initial,
    open,
    toggle,
    rootRef,
    triggerId,
    panelId,
    onPanelKeyDown,
    onBlur,
    requestSignIn,
    requestSignOut,
    signOutDisabled,
    signOutLabel,
    signOutDialog,
  } = useAccountControl();

  if (hidden) {
    return null;
  }

  if (account.status === "loading") {
    return placement === "bar" ? (
      <div aria-hidden className={cx(accountControl.placement.bar, accountControl.placeholder)} />
    ) : null;
  }

  const googleButtonContent = (
    <>
      <span aria-hidden className={accountControl.googleState} />
      <Image
        src="/brand/google-g.svg"
        alt=""
        aria-hidden
        width={20}
        height={20}
        unoptimized
        className={accountControl.googleLogo}
      />
      <span className={accountControl.googleLabel}>{shell.account.signIn}</span>
    </>
  );

  const signInButton = (
    <button
      type="button"
      className={cx(accountControl.googleButton, accountControl.signIn[placement])}
      onClick={requestSignIn}
    >
      {googleButtonContent}
    </button>
  );

  const details = (
    <div className={accountControl.details}>
      <div className={accountControl.identity}>
        {account.user?.name ? <p className={accountControl.userName}>{account.user.name}</p> : null}
        {account.user?.email ? (
          <p className={accountControl.userEmail}>{account.user.email}</p>
        ) : null}
      </div>
      {syncStatusText ? <p className={accountControl.note}>{syncStatusText}</p> : null}
      {account.needsReauth ? (
        <>
          <p className={accountControl.note}>{shell.account.reauthNote}</p>
          <button
            type="button"
            className={cx(accountControl.googleButton, accountControl.reauth)}
            onClick={requestSignIn}
          >
            {googleButtonContent}
          </button>
        </>
      ) : null}
      <a
        href={driveFolderUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={accountControl.driveLink}
      >
        {shared.sync.openDriveFolder}
        <span className={accountControl.srOnly}> {shared.sync.opensInNewTab}</span>
      </a>
      <Button
        variant="outline"
        className={accountControl.action[placement]}
        disabled={signOutDisabled}
        onClick={requestSignOut}
      >
        {signOutLabel}
      </Button>
    </div>
  );

  const signOutConfirm = <ConfirmDialog {...signOutDialog} />;

  if (placement === "sheet") {
    return (
      <section className={cx(accountControl.placement.sheet, accountControl.sheetSection)}>
        <h3 className={accountControl.heading}>{shell.account.sectionTitle}</h3>
        {account.status === "signedOut" ? signInButton : details}
        {signOutConfirm}
      </section>
    );
  }

  if (account.status === "signedOut") {
    return <div className={accountControl.placement.bar}>{signInButton}</div>;
  }

  return (
    <div
      ref={rootRef}
      role="presentation"
      className={accountControl.placement.bar}
      onKeyDown={onPanelKeyDown}
      onBlur={onBlur}
    >
      <button
        id={triggerId}
        type="button"
        aria-label={shell.account.openAccount}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={accountControl.avatar}
        onClick={toggle}
      >
        {initial}
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={shell.account.sectionTitle}
          className={accountControl.panel}
        >
          {details}
        </div>
      ) : null}
      {signOutConfirm}
    </div>
  );
}
