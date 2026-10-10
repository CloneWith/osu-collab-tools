import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookieName, resolveLocale } from "./config";
import { getMessages } from "./messages";

export default getRequestConfig(async () => {
    // The locale is decided here, once, for the whole request. Reading the cookie makes these
    // routes dynamically rendered.
    //
    // `resolveLocale` is what keeps an edited or stale cookie from reaching the catalog lookup:
    // only a locale we actually ship can get through.
    const locale = resolveLocale((await cookies()).get(localeCookieName)?.value);

    return {
        locale,
        timeZone: "UTC",
        messages: getMessages(locale),
    };
});
