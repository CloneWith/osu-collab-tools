import hljs from "highlight.js/lib/core";

/**
 * 向 Highlight.js 注册 BBCode 解析库。
 * @author Paul Reid (https://github.com/highlightjs/highlightjs-bbcode/blob/master/bbcode.js)
 */
export function registerBBCodeHighlight() {
    hljs.registerLanguage("bbcode", function (_) {
        return {
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
                    begin: /[=;:8]'?\-?[\)\(3SPDO>@$|/]/,
                },
                {
                    className: "string",
                    begin: /:[\w]*:/,
                },
            ],
        };
    });
}
