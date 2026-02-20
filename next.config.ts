import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
    output: "export",
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
};

const withNextIntl = createNextIntlPlugin({
    requestConfig: "./lib/i18n/request.ts",
    experimental: {
        // Provide the path to the messages that you're using in `AppConfig`
        createMessagesDeclaration: "./messages/en.json",
    },
});
export default withNextIntl(nextConfig);
