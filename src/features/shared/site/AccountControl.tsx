/**
 * Purpose:
 * Header account control: a "Sign in with Google" button when signed out, a monogram avatar with a
 * disclosure panel (name, email, sync status, Drive folder link, sign out) when signed in. Renders nothing when Drive sync is off.
 *
 * Notes:
 * `bar` sits in the header row from `sm` up; `sheet` is an inline section of the phone menu, with no
 * popover. When the Google sign-in expired, the panel shows a note and "Sign in again".
 */
"use client";

import { shared } from "@/content/shared";
import { shell } from "@/content/shell";
import { Button } from "@/features/shared/components/Button";
import { cx } from "@/features/shared/utils/cx";
import { accountControl } from "./AccountControl.style";
import type { IAccountControlProps } from "./AccountControl.type";
import { useAccountControl } from "./useAccountControl";

export function AccountControl({ placement }: IAccountControlProps) {
  const {
    account,
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
  } = useAccountControl();

  if (account.status === "disabled") {
    return null;
  }

  if (account.status === "loading") {
    return placement === "bar" ? (
      <div aria-hidden className={cx(accountControl.placement.bar, accountControl.placeholder)} />
    ) : null;
  }

  const signInButton = (
    <Button variant="outline" className={accountControl.signIn[placement]} onClick={requestSignIn}>
      {shell.account.signIn}
    </Button>
  );

  const details = (
    <div className={accountControl.details}>
      <div className={accountControl.identity}>
        {account.user?.name ? <p className={accountControl.userName}>{account.user.name}</p> : null}
        <p className={accountControl.userEmail}>{account.user?.email}</p>
      </div>
      {syncStatusText ? <p className={accountControl.note}>{syncStatusText}</p> : null}
      {account.needsReauth ? (
        <>
          <p className={accountControl.note}>{shell.account.reauthNote}</p>
          <Button className={accountControl.action[placement]} onClick={requestSignIn}>
            {shell.account.signInAgain}
          </Button>
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
        onClick={requestSignOut}
      >
        {shell.account.signOut}
      </Button>
    </div>
  );

  if (placement === "sheet") {
    return (
      <section className={cx(accountControl.placement.sheet, accountControl.sheetSection)}>
        <h3 className={accountControl.heading}>{shell.account.sectionTitle}</h3>
        {account.status === "signedOut" ? signInButton : details}
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
    </div>
  );
}
