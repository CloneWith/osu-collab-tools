import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCommon from "../public/locales/zh/common.json";
import enCommon from "../public/locales/en/common.json";
import zhHome from "../public/locales/zh/home.json";
import enHome from "../public/locales/en/home.json";
import zhNavbar from "../public/locales/zh/navbar.json";
import enNavbar from "../public/locales/en/navbar.json";
import zhAvatar from "../public/locales/zh/avatar.json";
import enAvatar from "../public/locales/en/avatar.json";
import zhImagemap from "../public/locales/zh/imagemap.json";
import enImagemap from "../public/locales/en/imagemap.json";
import zhSettings from "../public/locales/zh/settings.json";
import enSettings from "../public/locales/en/settings.json";

interface LanguageInfo {
    code: string;
    name: string;
}

// TODO: Consider cimode debug language support
export const supportedLanguages: LanguageInfo[] = [
    {code: "en", name: "English"},
    {code: "zh", name: "简体中文"},
];

// 配置 i18next
// TODO: Add l10n for documents
i18n
    .use(initReactI18next)
    .init({
        resources: {
            zh: {
                common: zhCommon,
                home: zhHome,
                navbar: zhNavbar,
                avatar: zhAvatar,
                imagemap: zhImagemap,
                settings: zhSettings,
            },
            en: {
                common: enCommon,
                home: enHome,
                navbar: enNavbar,
                avatar: enAvatar,
                imagemap: enImagemap,
                settings: enSettings,
            },
        },
        fallbackLng: "en",
        ns: ["common", "home", "navbar", "avatar", "imagemap", "settings"],
        defaultNS: "common",
    })
    .catch((err) => {
        console.error("Unable to initialize I18N.", err);
    });

export default i18n;
