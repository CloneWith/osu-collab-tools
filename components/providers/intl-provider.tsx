"use client";

import { defaultLocale, getMessages, isLocale } from "@/lib/i18n";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface IntlContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const IntlContext = createContext<IntlContextType | undefined>(undefined);

export function useIntlContext() {
  const context = useContext(IntlContext);
  if (!context) {
    throw new Error("useIntlContext must be used within an IntlProvider");
  }
  return context;
}

interface IntlProviderProps {
  children: React.ReactNode;
}

export function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLocale = localStorage.getItem("locale");
    if (storedLocale && isLocale(storedLocale)) {
      setLocale(storedLocale as Locale);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("locale", locale);
    }
  }, [locale, mounted]);

  const messages = getMessages(locale);

  return (
    <IntlContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} timeZone="UTC" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}
