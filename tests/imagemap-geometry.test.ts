import {
    calculateResizedRect,
    clampRectToImage,
    clampZoom,
    computeFitZoom,
    cursorForRotatedHandle,
    findRectAt,
    hitTestRect,
    inverseRotatePoint,
    MIN_RECT_SIZE,
    normalizeRotation,
    rectCenter,
    resizeHandles,
    rotatePoint,
    touchTargetSize,
    ZOOM_MAX,
    ZOOM_MIN,
} from "@/app/imagemap/editor/geometry";
import { RectangleType, type Rectangle } from "@/app/imagemap/types";
import { describe, expect, it } from "vitest";

const BOUNDS = { width: 1000, height: 800 };

function makeRect(overrides: Partial<Rectangle> = {}): Rectangle {
    return {
        id: "rect-1",
        type: RectangleType.MapArea,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        href: "",
        alt: "",
        ...overrides,
    };
}

describe("clampZoom", () => {
    it("clamps to the supported range", () => {
        expect(clampZoom(0.01)).toBe(ZOOM_MIN);
        expect(clampZoom(99)).toBe(ZOOM_MAX);
    });

    it("passes through in-range values", () => {
        expect(clampZoom(1)).toBe(1);
        expect(clampZoom(2.5)).toBe(2.5);
        expect(clampZoom(ZOOM_MIN)).toBe(ZOOM_MIN);
        expect(clampZoom(ZOOM_MAX)).toBe(ZOOM_MAX);
    });

    it("falls back to 1 for non-finite input", () => {
        expect(clampZoom(Number.NaN)).toBe(1);
        expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(ZOOM_MAX);
    });
});

describe("computeFitZoom", () => {
    it("fits a landscape image by width", () => {
        // (800 - 64) / 1000 = 0.736; (600 - 64) / 500 = 1.072 -> width wins
        expect(
            computeFitZoom(
                { width: 1000, height: 500 },
                { width: 800, height: 600 },
            ),
        ).toBeCloseTo(0.736, 5);
    });

    it("fits a portrait image by height", () => {
        expect(
            computeFitZoom(
                { width: 500, height: 1000 },
                { width: 800, height: 600 },
            ),
        ).toBeCloseTo(0.536, 5);
    });

    it("honours a custom padding", () => {
        expect(
            computeFitZoom(
                { width: 1000, height: 1000 },
                { width: 1000, height: 1000 },
                0,
            ),
        ).toBe(1);
        expect(
            computeFitZoom(
                { width: 1000, height: 1000 },
                { width: 1000, height: 1000 },
                100,
            ),
        ).toBeCloseTo(0.8, 5);
    });

    it("clamps the result even when the viewport is far larger than the image", () => {
        expect(
            computeFitZoom(
                { width: 10, height: 10 },
                { width: 5000, height: 5000 },
            ),
        ).toBe(ZOOM_MAX);
    });

    it("returns 1 when the image has no measured size yet", () => {
        expect(
            computeFitZoom(
                { width: 0, height: 0 },
                { width: 800, height: 600 },
            ),
        ).toBe(1);
    });

    it("never returns 0 or negative for a tiny viewport", () => {
        const zoom = computeFitZoom(
            { width: 1000, height: 1000 },
            { width: 10, height: 10 },
        );
        expect(zoom).toBeGreaterThan(0);
    });
});

describe("normalizeRotation", () => {
    it("normalizes into [0, 360)", () => {
        expect(normalizeRotation(0)).toBe(0);
        expect(normalizeRotation(45)).toBe(45);
        expect(normalizeRotation(360)).toBe(0);
        expect(normalizeRotation(400)).toBe(40);
        expect(normalizeRotation(-90)).toBe(270);
        expect(normalizeRotation(-450)).toBe(270);
    });

    it("treats missing and non-finite values as no rotation", () => {
        expect(normalizeRotation(undefined)).toBe(0);
        expect(normalizeRotation(Number.NaN)).toBe(0);
    });

    it("never returns negative zero", () => {
        expect(Object.is(normalizeRotation(-0), 0)).toBe(true);
        expect(Object.is(normalizeRotation(-360), 0)).toBe(true);
    });
});

describe("rotatePoint / inverseRotatePoint", () => {
    const center = { x: 100, y: 100 };

    it("round-trips", () => {
        const point = { x: 130, y: 170 };
        for (const deg of [0, 17, 45, 90, 180, 270, 359]) {
            const back = inverseRotatePoint(
                rotatePoint(point, center, deg),
                center,
                deg,
            );
            expect(back.x).toBeCloseTo(point.x, 6);
            expect(back.y).toBeCloseTo(point.y, 6);
        }
    });

    it("rotates a point on the +x axis to +y at 90 degrees", () => {
        const rotated = rotatePoint({ x: 150, y: 100 }, center, 90);
        expect(rotated.x).toBeCloseTo(100, 6);
        expect(rotated.y).toBeCloseTo(150, 6);
    });

    it("is a no-op at 0 degrees", () => {
        expect(rotatePoint({ x: 5, y: 9 }, center, 0)).toEqual({ x: 5, y: 9 });
    });

    it("keeps the center fixed", () => {
        expect(rotatePoint(center, center, 37)).toEqual(center);
    });
});

describe("rectCenter", () => {
    it("returns the geometric center", () => {
        expect(
            rectCenter(makeRect({ x: 100, y: 100, width: 200, height: 150 })),
        ).toEqual({ x: 200, y: 175 });
    });
});

describe("hitTestRect", () => {
    it("matches an axis-aligned rectangle", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        expect(hitTestRect({ x: 150, y: 150 }, rect)).toBe(true);
        expect(hitTestRect({ x: 100, y: 100 }, rect)).toBe(true);
        expect(hitTestRect({ x: 300, y: 250 }, rect)).toBe(true);
        expect(hitTestRect({ x: 99, y: 150 }, rect)).toBe(false);
        expect(hitTestRect({ x: 301, y: 150 }, rect)).toBe(false);
    });

    it("is rotation-aware", () => {
        // 200x150 box at (100,100); rotating 90deg about its center moves the
        // former top-right corner (300,100) to below the center.
        const rect = makeRect({
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            rotation: 90,
        });
        const center = rectCenter(rect);

        expect(hitTestRect(center, rect)).toBe(true);

        // 90deg clockwise: the unrotated top edge becomes the right edge.
        const rotatedTopEdgeMid = rotatePoint({ x: 200, y: 100 }, center, 90);
        expect(hitTestRect(rotatedTopEdgeMid, rect)).toBe(true);

        // ...and a point beyond the new right edge must miss.
        const beyond = rotatePoint({ x: 200, y: 99 }, center, 90);
        expect(hitTestRect(beyond, rect)).toBe(false);
    });

    it("rejects a point inside the unrotated box but outside the rotated one", () => {
        const rect = makeRect({
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            rotation: 45,
        });
        // The unrotated corner is far outside the rotated diamond.
        expect(hitTestRect({ x: 2, y: 2 }, rect)).toBe(false);
        expect(hitTestRect({ x: 100, y: 100 }, rect)).toBe(true);
    });

    it("ignores rotation on non-avatar regions is a caller concern, not this function's", () => {
        // The helper is generic; whether a region may rotate is enforced by the UI.
        const rect = makeRect({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 30,
        });
        expect(hitTestRect(rectCenter(rect), rect)).toBe(true);
    });
});

describe("findRectAt", () => {
    it("returns the topmost region first", () => {
        // Index 0 renders with the highest z-index, so it must win the hit test.
        const bottom = makeRect({
            id: "bottom",
            x: 0,
            y: 0,
            width: 300,
            height: 300,
        });
        const top = makeRect({
            id: "top",
            x: 0,
            y: 0,
            width: 300,
            height: 300,
        });
        expect(findRectAt({ x: 50, y: 50 }, [top, bottom])?.id).toBe("top");
        expect(findRectAt({ x: 50, y: 50 }, [bottom, top])?.id).toBe("bottom");
    });

    it("skips regions that do not contain the point", () => {
        const a = makeRect({ id: "a", x: 0, y: 0, width: 50, height: 50 });
        const b = makeRect({ id: "b", x: 200, y: 200, width: 50, height: 50 });
        expect(findRectAt({ x: 210, y: 210 }, [a, b])?.id).toBe("b");
        expect(findRectAt({ x: 999, y: 999 }, [a, b])).toBeUndefined();
    });
});

describe("clampRectToImage", () => {
    it("keeps a valid region untouched", () => {
        const rect = makeRect({ x: 10, y: 20, width: 30, height: 40 });
        expect(clampRectToImage(rect, BOUNDS)).toEqual(rect);
    });

    it("pulls a negative origin back to zero", () => {
        const clamped = clampRectToImage(makeRect({ x: -50, y: -20 }), BOUNDS);
        expect(clamped.x).toBe(0);
        expect(clamped.y).toBe(0);
    });

    it("pushes an overflowing origin back inside", () => {
        const clamped = clampRectToImage(
            makeRect({ x: 950, y: 780, width: 200, height: 150 }),
            BOUNDS,
        );
        expect(clamped.x).toBe(800);
        expect(clamped.y).toBe(650);
    });

    it("never yields a negative maximum when the region is larger than the image", () => {
        const clamped = clampRectToImage(
            makeRect({ x: 0, y: 0, width: 5000, height: 5000 }),
            BOUNDS,
        );
        expect(clamped.x).toBe(0);
        expect(clamped.y).toBe(0);
        expect(clamped.width).toBeLessThanOrEqual(BOUNDS.width);
        expect(clamped.height).toBeLessThanOrEqual(BOUNDS.height);
    });
});

describe("calculateResizedRect", () => {
    it("grows from the right edge", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "right",
            { x: 50, y: 0 },
            BOUNDS,
        );
        expect(next).toMatchObject({ x: 100, y: 100, width: 250, height: 150 });
    });

    it("moves the left edge and compensates the width", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "left",
            { x: 40, y: 0 },
            BOUNDS,
        );
        expect(next).toMatchObject({ x: 140, y: 100, width: 160, height: 150 });
    });

    it("moves both edges from the top-left corner", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "top-left",
            { x: 10, y: 20 },
            BOUNDS,
        );
        expect(next).toMatchObject({ x: 110, y: 120, width: 190, height: 130 });
    });

    it("moves both edges from the bottom-right corner", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: 10, y: 20 },
            BOUNDS,
        );
        expect(next).toMatchObject({ x: 100, y: 100, width: 210, height: 170 });
    });

    it("covers all eight handles without producing invalid geometry", () => {
        const rect = makeRect();
        const handles = [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ] as const;
        for (const handle of handles) {
            const next = calculateResizedRect(
                rect,
                handle,
                { x: 37, y: -23 },
                BOUNDS,
            );
            expect(next.width).toBeGreaterThanOrEqual(MIN_RECT_SIZE);
            expect(next.height).toBeGreaterThanOrEqual(MIN_RECT_SIZE);
            expect(next.x).toBeGreaterThanOrEqual(0);
            expect(next.y).toBeGreaterThanOrEqual(0);
            expect(next.x + next.width).toBeLessThanOrEqual(BOUNDS.width);
            expect(next.y + next.height).toBeLessThanOrEqual(BOUNDS.height);
        }
    });

    it("enforces the minimum size", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: -9999, y: -9999 },
            BOUNDS,
        );
        expect(next.width).toBe(MIN_RECT_SIZE);
        expect(next.height).toBe(MIN_RECT_SIZE);
    });

    it("stops the left/top edges from crossing the opposite one", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 150 });
        const next = calculateResizedRect(
            rect,
            "left",
            { x: 9999, y: 0 },
            BOUNDS,
        );
        expect(next.x + next.width).toBeLessThanOrEqual(rect.x + rect.width);
        expect(next.width).toBe(MIN_RECT_SIZE);
    });

    it("clamps the right edge to the image width", () => {
        const rect = makeRect({ x: 900, y: 100, width: 100, height: 150 });
        const next = calculateResizedRect(
            rect,
            "right",
            { x: 9999, y: 0 },
            BOUNDS,
        );
        expect(next.x + next.width).toBe(BOUNDS.width);
    });

    it("locks the aspect ratio for avatar regions", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: 100, y: 0 },
            BOUNDS,
            { width: 100, height: 50 },
        );

        // Natural ratio is 2:1, so a 100px wide drag yields a 50px tall box.
        expect(next.width).toBe(300);
        expect(next.height).toBe(150);
        // Anchored at the top-left of the unrotated box.
        expect(next.x).toBe(100);
        expect(next.y).toBe(100);
    });

    it("keeps the avatar ratio when shrinking", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: -80, y: 0 },
            BOUNDS,
            { width: 100, height: 50 },
        );

        expect(next.width).toBe(120);
        expect(next.height).toBe(60);
    });

    it("does not lock the aspect ratio for map-area regions", () => {
        const rect = makeRect({ x: 100, y: 100, width: 200, height: 200 });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: 100, y: 0 },
            BOUNDS,
            { width: 100, height: 50 },
        );
        expect(next).toMatchObject({ width: 300, height: 200 });
    });

    it("keeps the avatar ratio when no measurement is available", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        // Ratio falls back to 1, so a 100px drag keeps the box square.
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: 100, y: 0 },
            BOUNDS,
            undefined,
        );
        expect(next).toMatchObject({ width: 300, height: 300 });
    });

    it("preserves unrelated fields such as rotation", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            rotation: 45,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        const next = calculateResizedRect(
            rect,
            "bottom-right",
            { x: 10, y: 10 },
            BOUNDS,
            { width: 100, height: 100 },
        );
        expect(next.rotation).toBe(45);
        expect(next.id).toBe(rect.id);
        expect(next.avatar).toEqual(rect.avatar);
    });
});

describe("cursorForRotatedHandle", () => {
    it("maps the unrotated handles to the four resize cursors", () => {
        expect(cursorForRotatedHandle("right", 0)).toBe("ew-resize");
        expect(cursorForRotatedHandle("left", 0)).toBe("ew-resize");
        expect(cursorForRotatedHandle("bottom", 0)).toBe("ns-resize");
        expect(cursorForRotatedHandle("top", 0)).toBe("ns-resize");
        expect(cursorForRotatedHandle("bottom-right", 0)).toBe("nwse-resize");
        expect(cursorForRotatedHandle("top-left", 0)).toBe("nwse-resize");
        expect(cursorForRotatedHandle("top-right", 0)).toBe("nesw-resize");
        expect(cursorForRotatedHandle("bottom-left", 0)).toBe("nesw-resize");
    });

    it("rotates the cursor with the region", () => {
        // A right-edge handle on a region rotated 45deg points diagonally.
        expect(cursorForRotatedHandle("right", 45)).toBe("nwse-resize");
        expect(cursorForRotatedHandle("right", 90)).toBe("ns-resize");
        expect(cursorForRotatedHandle("right", 180)).toBe("ew-resize");
        expect(cursorForRotatedHandle("right", 270)).toBe("ns-resize");
    });

    it("snaps to the nearest 45 degree step", () => {
        expect(cursorForRotatedHandle("right", 40)).toBe("nwse-resize");
        expect(cursorForRotatedHandle("right", 20)).toBe("ew-resize");
    });

    it("is stable across a full turn", () => {
        for (const deg of [0, 90, 180, 270, 360, 450]) {
            expect(cursorForRotatedHandle("right", deg)).toBe(
                cursorForRotatedHandle("right", deg % 360),
            );
        }
    });
});

describe("resizeHandles", () => {
    it("returns all eight handles for a map-area region", () => {
        expect(resizeHandles(makeRect())).toHaveLength(8);
    });

    it("returns only the bottom-right handle for an avatar region", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        const handles = resizeHandles(rect);
        expect(handles).toHaveLength(1);
        expect(handles[0].handle).toBe("bottom-right");
    });

    it("anchors corners and edges at the expected percentages", () => {
        const byHandle = Object.fromEntries(
            resizeHandles(makeRect()).map((h) => [h.handle, h]),
        );
        expect(byHandle["top-left"]).toMatchObject({ left: "0%", top: "0%" });
        expect(byHandle["top-right"]).toMatchObject({
            left: "100%",
            top: "0%",
        });
        expect(byHandle["bottom-left"]).toMatchObject({
            left: "0%",
            top: "100%",
        });
        expect(byHandle["bottom-right"]).toMatchObject({
            left: "100%",
            top: "100%",
        });
        expect(byHandle.top).toMatchObject({ left: "50%", top: "0%" });
        expect(byHandle.left).toMatchObject({ left: "0%", top: "50%" });
    });

    it("accounts for the region rotation in the cursor", () => {
        const rect = makeRect({
            type: RectangleType.Avatar,
            rotation: 90,
            avatar: {
                styleKey: "simple",
                imageUrl: "",
                username: "",
                countryCode: "",
            },
        });
        // The bottom-right outward normal sits at 45deg; rotating the region by 90deg
        // moves it to 135deg, i.e. a NE-SW drag.
        expect(resizeHandles(rect)[0].cursor).toBe("nesw-resize");
    });
});

describe("touchTargetSize", () => {
    it("keeps the requested size when it is already large enough", () => {
        expect(touchTargetSize(10, 44)).toBe(44);
        expect(touchTargetSize(50, 44)).toBe(50);
    });
});
