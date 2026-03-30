import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh-CN.json";
import type { Locale } from "next-intl";

export function getMessages(locale: Locale) {
    switch (locale) {
        case "en":
            return enMessages;
        case "zh-CN":
            return zhMessages;
        default:
            return enMessages;
    }
}
