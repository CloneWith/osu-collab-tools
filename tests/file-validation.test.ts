import { validateFilename } from "@/lib/validation";
import { describe, expect, it } from "vitest";

describe("validateFilename", () => {
    it("accepts a normal filename", () => {
        const result = validateFilename("export-image_01");
        expect(result.success).toBe(true);
        expect(result.messageKey).toBeUndefined();
    });

    it("rejects a filename with surrounding whitespace", () => {
        const result = validateFilename("  report-final  ");
        expect(result.success).toBe(false);
    });

    it("rejects an empty filename", () => {
        const result = validateFilename("   ");
        expect(result.success).toBe(false);
        expect(result.messageKey).toBeTruthy();
    });

    it("rejects dot and dot-dot path names", () => {
        expect(validateFilename(".").success).toBe(false);
        expect(validateFilename("..").success).toBe(false);
    });

    it("rejects path traversal patterns and separators", () => {
        expect(validateFilename("../secret").success).toBe(false);
        expect(validateFilename("..\\secret").success).toBe(false);

        expect(validateFilename("foo/bar").success).toBe(false);
        expect(validateFilename("foo\\bar").success).toBe(false);
    });

    it("rejects Windows reserved names", () => {
        expect(validateFilename("CON").success).toBe(false);
        expect(validateFilename("nul.txt").success).toBe(false);
        expect(validateFilename("LPT1").success).toBe(false);
    });

    it("rejects unsupported filesystem characters", () => {
        expect(validateFilename("bad<name").success).toBe(false);
        expect(validateFilename("bad|name").success).toBe(false);
        expect(validateFilename('bad"name').success).toBe(false);
    });

    it("rejects control characters", () => {
        expect(validateFilename("bad\u0000name").success).toBe(false);
        expect(validateFilename("bad\u007Fname").success).toBe(false);
    });

    it("rejects bidi override/control characters", () => {
        expect(validateFilename("safe\u202Etxt").success).toBe(false);
        expect(validateFilename("safe\u2066txt").success).toBe(false);
    });

    it("rejects filenames with byte length over 255", () => {
        const overByteLimit = "你".repeat(90);
        expect(validateFilename(overByteLimit).success).toBe(false);
    });
});
