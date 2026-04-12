import { describe, expect, it } from "vitest";
import { generateShareToken } from "../../src/modules/share/server/token";

describe("share token generation", () => {
  it("creates opaque url-safe tokens", () => {
    const firstToken = generateShareToken();
    const secondToken = generateShareToken();

    expect(firstToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(firstToken.length).toBeGreaterThanOrEqual(43);
    expect(secondToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(secondToken.length).toBeGreaterThanOrEqual(43);
    expect(firstToken).not.toEqual(secondToken);
  });
});
