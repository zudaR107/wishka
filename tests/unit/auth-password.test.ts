import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/modules/auth/server/password";
import { normalizeEmail } from "../../src/modules/auth/server/email";

describe("auth password helpers", () => {
  it("hashes and verifies a password", async () => {
    const password = "correct horse battery staple";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toContain("$");
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword("password", "invalid-hash")).resolves.toBe(false);
  });
});

describe("auth email helper", () => {
  it("normalizes email input for auth flows", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });
});
