import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseError } from "pg";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  transaction: vi.fn(),
  txInsert: vi.fn(),
  txInsertValues: vi.fn(),
  txInsertReturning: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      users: {
        findFirst: mocks.findFirst,
      },
    },
    transaction: mocks.transaction,
  },
}));

vi.mock("../../src/modules/auth/server/password", () => ({
  hashPassword: mocks.hashPassword,
}));

import { registerUser } from "../../src/modules/auth/server/register";

describe("register user flow", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.transaction.mockReset();
    mocks.txInsert.mockReset();
    mocks.txInsertValues.mockReset();
    mocks.txInsertReturning.mockReset();
    mocks.hashPassword.mockReset();

    // tx object passed to the transaction callback
    const tx = {
      insert: mocks.txInsert,
    };
    mocks.txInsert.mockReturnValue({ values: mocks.txInsertValues });
    mocks.txInsertValues.mockReturnValue({ returning: mocks.txInsertReturning });
    // default: first insert (users) returns new user; second insert (wishlists) resolves
    mocks.txInsertReturning.mockResolvedValue([{ id: "new-user-id" }]);

    // transaction executes the callback immediately with the tx object
    mocks.transaction.mockImplementation((cb: (tx: typeof tx) => Promise<unknown>) => cb(tx));
  });

  it("rejects invalid input before querying the database", async () => {
    await expect(registerUser({ email: "bad-email", password: "short" })).resolves.toEqual({
      status: "error",
      code: "invalid-email",
    });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.hashPassword).not.toHaveBeenCalled();
  });

  it("creates a user and a default wishlist for valid new credentials", async () => {
    mocks.findFirst.mockResolvedValue(undefined);
    mocks.hashPassword.mockResolvedValue("hashed-password");

    // first call (users insert) → user row; second call (wishlists insert) → undefined
    mocks.txInsertReturning
      .mockResolvedValueOnce([{ id: "new-user-id" }]);
    mocks.txInsertValues
      .mockReturnValueOnce({ returning: mocks.txInsertReturning })
      .mockResolvedValueOnce(undefined);

    await expect(
      registerUser({ email: " User@Example.com ", password: "password123" }),
    ).resolves.toEqual({ status: "success", userId: "new-user-id" });

    expect(mocks.hashPassword).toHaveBeenCalledWith("password123");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    // first insert: user row
    expect(mocks.txInsertValues).toHaveBeenCalledWith({
      email: "user@example.com",
      passwordHash: "hashed-password",
      preferredCurrency: "RUB",
    });
    // second insert: default wishlist
    expect(mocks.txInsertValues).toHaveBeenCalledWith({
      userId: "new-user-id",
      name: "Мой список",
      isActive: true,
    });
  });

  it("returns duplicate email when the user already exists", async () => {
    mocks.findFirst.mockResolvedValue({ id: "user-1" });

    await expect(
      registerUser({ email: "user@example.com", password: "password123" }),
    ).resolves.toEqual({
      status: "error",
      code: "email-taken",
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("maps unique email insert races to duplicate email", async () => {
    const error = new DatabaseError("duplicate key", 0, "error");
    error.code = "23505";

    mocks.findFirst.mockResolvedValue(undefined);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.transaction.mockRejectedValue(error);

    await expect(
      registerUser({ email: "user@example.com", password: "password123" }),
    ).resolves.toEqual({
      status: "error",
      code: "email-taken",
    });
  });
});
