"use client";

import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <Select value={i18n.language} onValueChange={lang => changeLanguage(lang)}>
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