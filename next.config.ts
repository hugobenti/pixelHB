/**
 * Purpose:
 * Next.js configuration for PixelHB; pins Turbopack root when multiple lockfiles exist upstream and
 * sends the security headers on every route.
 *
 * Notes:
 * The CSP only restricts what needs no script inventory: framing (clickjacking), `<base>`, plugins
 * and form targets. Only Auth.js's built-in pages submit forms (their sign-in form posts on to
 * accounts.google.com); the app itself signs in via fetch + `location`. It has no `script-src`: the
 * inline theme script in `layout.tsx`, Next's inline bootstrap scripts and Vercel Analytics would
 * need nonces or hashes, which is a project of its own.
 */
import type { NextConfig } from "next";

const CONTENT_SECURITY_POLICY = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Isolated production builds (e.g. an agent verifying a change while `next dev` or another
  // build uses .next): `NEXT_DIST_DIR=.next-verify npm run build && NEXT_DIST_DIR=.next-verify npm start`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
