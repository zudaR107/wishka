import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateRegisterUserInput,
} from "../../src/modules/auth/server/register-input";

describe("register user validation", () => {
  it("rejects invalid email", () => {
    expect(
      validateRegisterUserInput({
        email: "not-an-email",
        password: "password123",
      }),
    ).toEqual({ status: "error", code: "invalid-email" });
  });

  it("rejects short password", () => {
    expect(
      validateRegisterUserInput({
        email: "user@example.com",
        password: "x".repeat(MIN_PASSWORD_LENGTH - 1),
      }),
    ).toEqual({ status: "error", code: "password-too-short" });
  });

  it("accepts normalized valid credentials", () => {
    expect(
      validateRegisterUserInput({
        email: " User@Example.com ",
        password: "password123",
      }),
    ).toEqual({ status: "success" });
  });
});
