export const SUPPORTED_CURRENCIES = ["RUB", "USD", "EUR", "GBP", "CNY"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
};

export const DEFAULT_CURRENCY: CurrencyCode = "RUB";

/** Derive the default currency from the app locale. */
export function currencyFromLocale(locale: string): CurrencyCode {
  return locale === "ru" ? "RUB" : "USD";
}

/** Narrow an arbitrary string to CurrencyCode; fall back to default. */
export function parseCurrency(value: unknown): CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode)
    ? (value as CurrencyCode)
    : DEFAULT_CURRENCY;
}
