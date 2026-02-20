import { Locale } from "next-intl";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

export function getMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return enMessages;
    case "zh":
      return zhMessages;
    default:
      return enMessages;
  }
}
