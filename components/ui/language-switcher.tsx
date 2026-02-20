"use client";

import { Locale } from "next-intl";
import { useIntlContext } from "@/components/providers/intl-provider";
import { supportedLanguages } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSwitcher() {
  const { locale, setLocale } = useIntlContext();

  return (
    <Select value={locale} onValueChange={lang => setLocale(lang as Locale)}>
      <SelectTrigger>
        <SelectValue/>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map(l => (
          <SelectItem key={l.code} value={l.code}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
