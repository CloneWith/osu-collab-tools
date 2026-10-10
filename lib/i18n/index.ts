// Client-safe surface of the i18n helpers: the locale list and the resolvers.
//
// Not importing `messages` here to avoid bundling all languages. Server code
// imports `./messages` directly.
export * from "./config";
export * from "./languages";
