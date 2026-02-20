"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { Locale, NextIntlClientProvider } from "next-intl";
import { defaultLocale, getMessages } from "@/lib/i18n";

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
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const storedLocale = localStorage.getItem("locale");
      return storedLocale as Locale || defaultLocale;
    }
    return defaultLocale;
  });

  const messages = getMessages(locale);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
  }, [locale]);

  return (
    <IntlContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}
