import type { Locale } from "next-intl";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "zh-CN"];

/**
 * Where the chosen locale is persisted.
 *
 * A cookie travels with the request, which lets `lib/i18n/request.ts` resolve
 * the locale *before* the first byte is written.
 */
export const localeCookieName = "locale";

export function isLocale(value: unknown): value is Locale {
    return typeof value === "string" && locales.includes(value as Locale);
}

/** Narrows an untrusted value (in the cookie or local storage) to a locale we ship. */
export function resolveLocale(value: unknown): Locale {
    return isLocale(value) ? value : defaultLocale;
}
