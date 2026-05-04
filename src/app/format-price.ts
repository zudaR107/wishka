import { type CurrencyCode, CURRENCY_SYMBOLS } from "@/shared/lib/currency";

export function formatPrice(price: string, currency: CurrencyCode = "RUB"): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return formatted + " " + symbol;
}
