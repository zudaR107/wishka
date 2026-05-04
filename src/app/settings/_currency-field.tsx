"use client";

import { useState } from "react";
import { CurrencySelect } from "@/shared/ui/currency-select";
import { type CurrencyCode } from "@/shared/lib/currency";

type SettingsCurrencyFieldProps = {
  defaultCurrency: CurrencyCode;
  label: string;
};

export function SettingsCurrencyField({ defaultCurrency, label }: SettingsCurrencyFieldProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  return <CurrencySelect name="preferredCurrency" value={currency} onChange={setCurrency} label={label} />;
}
