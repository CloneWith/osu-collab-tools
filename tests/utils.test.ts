/**
 * Utility function tests
 * @module-tag utils
 */

import { describe, it, expect } from "vitest";
import { clamp, toRoundedPercent, isNullOrWhitespace } from "@/lib/utils";

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
    })

    it("division by zero", () => {
        expect(toRoundedPercent(0, 0)).toBe(NaN);
    })
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
