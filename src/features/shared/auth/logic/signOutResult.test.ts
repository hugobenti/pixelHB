import { describe, expect, it } from "vitest";

import { verifySignOutResult } from "./signOutResult";

describe("verifySignOutResult", () => {
  it("accepts a plain callback url", () => {
    expect(verifySignOutResult({ url: "http://localhost:3000/gallery" })).toBe("ok");
    expect(verifySignOutResult({ url: "/gallery?error=x" })).toBe("ok");
  });

  it("rejects the Auth.js error page, with or without a query or trailing slash", () => {
    expect(
      verifySignOutResult({ url: "http://localhost:3000/api/auth/error?error=MissingCSRF" }),
    ).toBe("failed");
    expect(verifySignOutResult({ url: "/api/auth/error/" })).toBe("failed");
  });

  it("rejects anything that is not a { url } object", () => {
    expect(verifySignOutResult(undefined)).toBe("failed");
    expect(verifySignOutResult(null)).toBe("failed");
    expect(verifySignOutResult({})).toBe("failed");
    expect(verifySignOutResult({ url: 3 })).toBe("failed");
    expect(verifySignOutResult("ok")).toBe("failed");
  });
});
