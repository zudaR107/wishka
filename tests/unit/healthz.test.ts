import { describe, expect, it } from "vitest";
import { GET } from "../../src/app/healthz/route";

describe("healthz route", () => {
  it("returns an ok status payload", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });
});
