"use client";

import { localeCookieName, resolveLocale } from "@/lib/i18n/config";
import { type AbstractIntlMessages, type Locale, NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

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

function readCookie(name: string): string | undefined {
  // Only first-party cookies are readable here, which is exactly the set we wrote ourselves.
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function writeLocaleCookie(locale: Locale) {
  // `path=/` so the choice applies site-wide, a year of `max-age` so it is not session-only, and
  // `samesite=lax` so it still travels on an ordinary top-level navigation.
  //
  // Plain `document.cookie` rather than the Cookie Store API: `cookieStore` is only exposed in a
  // secure context, so it would silently do nothing when this site is served over plain HTTP on a
  // LAN address, and `setLocale` is deliberately synchronous. The value is a validated locale
  // name, so there is nothing to escape either.
  // biome-ignore lint/suspicious/noDocumentCookie: no secure-context guarantee on this site.
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

interface IntlProviderProps {
  children: React.ReactNode;
  /** Resolved on the server, from the cookie. */
  locale: Locale;
  /** Already narrowed to one locale by the server, so a single catalog reaches the browser. */
  messages: AbstractIntlMessages;
}

export function IntlProvider({ children, locale, messages }: IntlProviderProps) {
  const router = useRouter();
  const migrationAttempted = useRef(false);

  const setLocale = useCallback(
    (next: Locale) => {
      writeLocaleCookie(next);
      // `router.refresh()` re-renders the server components, so the new messages arrive as props
      // and the text is swapped in place. The old language stays on screen for the duration of
      // the round-trip, which is the difference from the client-side swap this replaces: nothing
      // has to be "corrected" after paint, it simply gets replaced.
      //
      // `lang` is set explicitly as well because a refresh does not reliably re-apply attributes
      // on the document element, and it is read by screen readers and by font selection.
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );

  // One-way upgrade for anyone who picked a language while it still lived in `localStorage`.
  //
  // The ref is needed because the refresh below changes the `locale` prop, which re-runs this
  // effect. It also guards the pathological case: if the browser refuses to store the cookie, the
  // migration must not refresh again on the refreshed page, forever.
  useEffect(() => {
    if (migrationAttempted.current) return;
    migrationAttempted.current = true;

    if (readCookie(localeCookieName) !== undefined) return;

    const stored = localStorage.getItem(localeCookieName);
    if (!stored) return;

    const migrated = resolveLocale(stored);
    writeLocaleCookie(migrated);
    localStorage.removeItem(localeCookieName);

    if (migrated !== locale) router.refresh();
  }, [locale, router]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <IntlContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} timeZone="UTC" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}
