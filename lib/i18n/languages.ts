import { Locale } from "next-intl";

interface LanguageInfo {
    code: Locale;
    name: string;
}

export const supportedLanguages: LanguageInfo[] = [
    {code: "en", name: "English"},
    {code: "zh-CN", name: "简体中文"},
];


