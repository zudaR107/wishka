import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dbUpdate: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    update: () => ({
      set: () => ({
        where: mocks.dbUpdate,
      }),
    }),
  },
}));

import { updateUserBio } from "../../src/modules/auth/server/update-bio";

describe("updateUserBio", () => {
  beforeEach(() => {
    mocks.dbUpdate.mockReset();
    mocks.dbUpdate.mockResolvedValue(undefined);
  });

  it("saves a valid bio after trimming whitespace", async () => {
    const result = await updateUserBio("user-1", "  Люблю книги  ");

    expect(result).toEqual({ status: "success" });
    expect(mocks.dbUpdate).toHaveBeenCalledOnce();
  });

  it("saves an empty string as null (clears the bio)", async () => {
    const result = await updateUserBio("user-1", "   ");

    expect(result).toEqual({ status: "success" });
    expect(mocks.dbUpdate).toHaveBeenCalledOnce();
  });

  it("rejects a bio that exceeds 500 characters", async () => {
    const longBio = "а".repeat(501);

    const result = await updateUserBio("user-1", longBio);

    expect(result).toEqual({ status: "error", code: "too-long" });
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("accepts a bio of exactly 500 characters", async () => {
    const maxBio = "б".repeat(500);

    const result = await updateUserBio("user-1", maxBio);

    expect(result).toEqual({ status: "success" });
    expect(mocks.dbUpdate).toHaveBeenCalledOnce();
  });

  it("returns db-error when the database operation fails", async () => {
    mocks.dbUpdate.mockRejectedValue(new Error("DB down"));

    const result = await updateUserBio("user-1", "Обычное описание");

    expect(result).toEqual({ status: "error", code: "db-error" });
  });
});
