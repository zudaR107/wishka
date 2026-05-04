import { describe, expect, it } from "vitest";
import { formatPrice } from "../../src/app/format-price";

describe("formatPrice", () => {
  it("defaults to RUB when no currency provided", () => {
    expect(formatPrice("1990")).toBe("1 990 ₽");
  });

  it("formats RUB with ₽ symbol", () => {
    expect(formatPrice("1990", "RUB")).toBe("1 990 ₽");
  });

  it("formats USD with $ symbol", () => {
    expect(formatPrice("1990", "USD")).toBe("1 990 $");
  });

  it("formats EUR with € symbol", () => {
    expect(formatPrice("1990", "EUR")).toBe("1 990 €");
  });

  it("formats GBP with £ symbol", () => {
    expect(formatPrice("1990", "GBP")).toBe("1 990 £");
  });

  it("formats CNY with ¥ symbol", () => {
    expect(formatPrice("1990", "CNY")).toBe("1 990 ¥");
  });

  it("applies thousands separator to seven-digit numbers", () => {
    expect(formatPrice("1000000", "RUB")).toBe("1 000 000 ₽");
  });

  it("formats a three-digit price without thousands separator", () => {
    expect(formatPrice("990", "RUB")).toBe("990 ₽");
  });

  it("formats zero", () => {
    expect(formatPrice("0", "RUB")).toBe("0 ₽");
  });

  it("rounds up when fraction >= 0.5", () => {
    expect(formatPrice("9.7", "RUB")).toBe("10 ₽");
  });

  it("rounds down when fraction < 0.5", () => {
    expect(formatPrice("9.2", "RUB")).toBe("9 ₽");
  });

  it("returns raw string for non-numeric input", () => {
    expect(formatPrice("abc", "RUB")).toBe("abc");
  });
});
