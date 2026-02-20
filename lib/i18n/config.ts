import { Locale } from "next-intl";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "zh-CN"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
