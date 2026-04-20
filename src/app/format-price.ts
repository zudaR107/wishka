import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");

export function formatPrice(price: string): string {
  const num = parseFloat(price);
  const amount = isNaN(num)
    ? price
    : Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${amount}\u00a0${common.currencySymbol}`;
}
