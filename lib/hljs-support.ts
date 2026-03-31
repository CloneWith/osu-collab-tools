import hljs from "highlight.js/lib/core";

/**
 * Register BBCode syntax highlighting to Highlight.js.
 * @author Paul Reid (https://github.com/highlightjs/highlightjs-bbcode/blob/master/bbcode.js)
 */
export function registerBBCodeHighlight() {
    hljs.registerLanguage("bbcode", (_) => ({
        case_insensitive: true,
        contains: [
            {
                className: "name",
                begin: /\[[^=\s\]]*/,
            },
            {
                className: "name",
                begin: "]",
            },
            {
                className: "attribute",
                begin: /(?<==)[^\]\s]*/,
            },
            {
                className: "attr",
                begin: /(?<=\[[^\]]* )[^\s=\]]*/,
            },
            {
                className: "string",
                begin: /[=;:8]'?-?[)(3SPDO>@$|/]/,
            },
            {
                className: "string",
                begin: /:[\w]*:/,
            },
        ],
    }));
}
