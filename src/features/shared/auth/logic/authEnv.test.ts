import { describe, expect, it } from "vitest";

import { missingAuthEnv, missingAuthEnvMessage } from "./authEnv";

describe("missingAuthEnv", () => {
  it("is empty when every required variable is set", () => {
    expect(
      missingAuthEnv({ AUTH_SECRET: "s", AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "g" }),
    ).toEqual([]);
  });

  it("names every missing variable, in a fixed order", () => {
    expect(missingAuthEnv({})).toEqual(["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"]);
    expect(missingAuthEnv({ AUTH_SECRET: "s" })).toEqual(["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"]);
  });

  it("counts an empty or blank value as missing", () => {
    expect(
      missingAuthEnv({ AUTH_SECRET: "  ", AUTH_GOOGLE_ID: "", AUTH_GOOGLE_SECRET: "g" }),
    ).toEqual(["AUTH_SECRET", "AUTH_GOOGLE_ID"]);
  });
});

describe("missingAuthEnvMessage", () => {
  it("names each missing variable", () => {
    const text = missingAuthEnvMessage(["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"]);
    expect(text).toContain("AUTH_GOOGLE_ID");
    expect(text).toContain("AUTH_GOOGLE_SECRET");
    expect(text).not.toContain("AUTH_SECRET");
  });
});
