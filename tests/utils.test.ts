/**
 * Utility function tests
 * @module-tag utils
 */

import {
    clamp,
    debounce,
    escapeHtmlAttribute,
    generateImageMapHtml,
    isNullOrWhitespace,
    throttle,
    toRoundedPercent,
} from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("clamp", () => {
    it("should clamp value within range", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });
});

describe("toRoundedPercent", () => {
    it("should calculate percentage correctly", () => {
        expect(toRoundedPercent(50, 100)).toBe(50);
        expect(toRoundedPercent(33, 200)).toBe(16.5);
    });

    it("should return rounded results", () => {
        expect(toRoundedPercent(11.45, 100)).toBe(11.4);
    });

    it("division by zero", () => {
        expect(toRoundedPercent(0, 0)).toBe(NaN);
    });
});

describe("isNullOrWhitespace", () => {
    it("should detect null or whitespace strings", () => {
        expect(isNullOrWhitespace()).toBe(true);
        expect(isNullOrWhitespace(undefined)).toBe(true);
        expect(isNullOrWhitespace("")).toBe(true);
        expect(isNullOrWhitespace("   ")).toBe(true);
        expect(isNullOrWhitespace("hello")).toBe(false);
    });
});

describe("debounce", () => {
    it("should delay function execution", async () => {
        let called = false;
        const debounced = debounce(() => {
            called = true;
        }, 50);

        debounced();
        expect(called).toBe(false);

        await new Promise((resolve) => setTimeout(resolve, 60));
        expect(called).toBe(true);
    });

    it("should reset timer when called repeatedly", async () => {
        let callCount = 0;
        const debounced = debounce(() => {
            callCount++;
        }, 50);

        debounced();
        await new Promise((resolve) => setTimeout(resolve, 30));
        debounced();
        await new Promise((resolve) => setTimeout(resolve, 30));
        debounced();
        await new Promise((resolve) => setTimeout(resolve, 60));

        expect(callCount).toBe(1);
    });
});

describe("throttle", () => {
    it("should limit function execution to once per interval", async () => {
        let callCount = 0;
        const throttled = throttle(() => {
            callCount++;
        }, 50);

        throttled();
        throttled();
        throttled();
        expect(callCount).toBe(1);

        await new Promise((resolve) => setTimeout(resolve, 60));
        throttled();
        expect(callCount).toBe(2);
    });
});

describe("escapeHtmlAttribute", () => {
    it("should escape every character that can break out of a quoted attribute", () => {
        expect(escapeHtmlAttribute("&")).toBe("&amp;");
        expect(escapeHtmlAttribute("<")).toBe("&lt;");
        expect(escapeHtmlAttribute(">")).toBe("&gt;");
        expect(escapeHtmlAttribute('"')).toBe("&quot;");
        expect(escapeHtmlAttribute("'")).toBe("&#39;");
    });

    it("should escape in a single pass, without re-escaping the ampersands it adds", () => {
        // A naive implementation handling "&" by replacing it first would turn "&"
        // into "&amp;" and then escape that ampersand again. The lookup table replaces
        // each character in one pass, so an ampersand is only ever escaped once.
        expect(escapeHtmlAttribute("&<>")).toBe("&amp;&lt;&gt;");
        expect(escapeHtmlAttribute('<a href="x">&</a>')).toBe(
            "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
        );
    });

    it("should leave ordinary text untouched", () => {
        const safe = "osu! collab map 1/2/3";
        expect(escapeHtmlAttribute(safe)).toBe(safe);
        expect(escapeHtmlAttribute("")).toBe("");
    });

    it("should handle non-ASCII text without mangling it", () => {
        expect(escapeHtmlAttribute("区域 🎯 Collaboration")).toBe(
            "区域 🎯 Collaboration",
        );
    });

    it("should not be idempotent, so escaping twice double-escapes", () => {
        // Worth pinning down: callers must escape exactly once. An escaper that
        // "recognised" its own output would silently skip escaping a literal "&amp;".
        expect(escapeHtmlAttribute(escapeHtmlAttribute("&"))).toBe("&amp;amp;");
    });
});

describe("generateImageMapHtml", () => {
    const area = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        href: "https://osu.ppy.sh/users/1",
        alt: "Area 1",
    };

    it("should render a well-formed img and map", () => {
        const html = generateImageMapHtml(
            [area],
            "https://example.com/a.png",
            "mymap",
        );

        expect(html).toContain(
            '<img src="https://example.com/a.png" alt="Collab Image" usemap="#mymap">',
        );
        expect(html).toContain('<map name="mymap">');
        expect(html).toContain('coords="10,20,110,70"');
        expect(html).toContain('href="https://osu.ppy.sh/users/1"');
        expect(html).toContain('alt="Area 1"');
    });

    it("should fall back to defaults when the image path and map name are missing", () => {
        const html = generateImageMapHtml([area], undefined, undefined);

        expect(html).toContain('src="your-image.jpg"');
        expect(html).toContain('name="imagemap"');
    });

    it("should round coordinates rather than emitting fractions", () => {
        const html = generateImageMapHtml(
            [{ ...area, x: 10.4, y: 20.6, width: 100.5, height: 50.49 }],
            undefined,
            undefined,
        );

        // x + width = 110.9 -> 111, y + height = 71.09 -> 71
        expect(html).toContain('coords="10,21,111,71"');
    });

    it("should neutralise a quote in alt so it cannot terminate the attribute", () => {
        const html = generateImageMapHtml(
            [{ ...area, alt: '" onload="alert(1)' }],
            undefined,
            undefined,
        );

        expect(html).not.toContain('alt="" onload="alert(1)"');
        expect(html).toContain('alt="&quot; onload=&quot;alert(1)"');
    });

    it("should neutralise markup in every interpolated field", () => {
        const html = generateImageMapHtml(
            [
                {
                    ...area,
                    href: '"><script>alert(1)</script>',
                    alt: "<img src=x>",
                },
            ],
            'a.png"><script>alert(2)</script>',
            'm"><script>alert(3)</script>',
        );

        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<img src=x>");
    });

    it("should leave only the tags it emits itself", () => {
        const html = generateImageMapHtml(
            [
                {
                    ...area,
                    href: '"><script>alert(1)</script>',
                    alt: "</alt><b>",
                },
            ],
            "a.png",
            "m",
        );
        const tags =
            html.match(/<\/?([a-z]+)/gi)?.map((tag) => tag.toLowerCase()) ?? [];

        expect(new Set(tags)).toEqual(
            new Set(["<img", "<map", "</map", "<area"]),
        );
    });

    it("should emit one area element per rectangle", () => {
        const html = generateImageMapHtml(
            [
                area,
                { ...area, x: 200, alt: "Area 2" },
                { ...area, x: 400, alt: "Area 3" },
            ],
            undefined,
            undefined,
        );

        expect(html.match(/<area /g)).toHaveLength(3);
    });
});
