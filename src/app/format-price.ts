import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");

export function formatPrice(price: string): string {
  const num = parseFloat(price);
  const amount = isNaN(num) ? price : String(Math.round(num));
  return `${amount} ${common.currencySymbol}`;
}
