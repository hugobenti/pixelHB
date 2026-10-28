/**
 * Purpose:
 * How long the sign-in cookie lasts after the last visit, shared by Auth.js's `session.maxAge` and
 * the account hint's expiry (the hint must never outlive the session it remembers).
 */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
