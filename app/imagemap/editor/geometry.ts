/**
 * Pure geometry helpers for the imagemap editor.
 *
 * Zero React, zero DOM, zero i18n. Everything here is directly unit-testable.
 */

import { RectangleType, type Rectangle } from "@/app/imagemap/types";

/** Minimum width/height of a region, in original image pixels. */
export const MIN_RECT_SIZE = 20;

/** Lower bound of the preview zoom factor. */
export const ZOOM_MIN = 0.1;

/** Upper bound of the preview zoom factor. */
export const ZOOM_MAX = 4;

/** Breathing room left around the image when fitting it to the viewport. */
export const ZOOM_FIT_PADDING = 32;

export type ResizeHandle =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

/** Clamp a zoom factor into the supported range. */
export function clampZoom(zoom: number): number {
    if (Number.isNaN(zoom)) return 1;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * Largest zoom factor at which the whole image still fits inside the viewport,
 * clamped to the supported range. The padding is subtracted from both axes.
 */
export function computeFitZoom(natural: Size, viewport: Size, padding: number = ZOOM_FIT_PADDING): number {
    if (natural.width <= 0 || natural.height <= 0) return 1;

    const availableWidth = Math.max(1, viewport.width - padding * 2);
    const availableHeight = Math.max(1, viewport.height - padding * 2);

    return clampZoom(Math.min(availableWidth / natural.width, availableHeight / natural.height));
}

/**
 * Normalize an arbitrary degree value into `[0, 360)`.
 * Used for avatar regions only — other region types cannot express rotation.
 */
export function normalizeRotation(degrees?: number): number {
    if (degrees === undefined || !Number.isFinite(degrees)) return 0;
    const normalized = ((degrees % 360) + 360) % 360;
    // Avoid `-0` leaking into styles and comparisons.
    return normalized === 0 ? 0 : normalized;
}

/** Center point of a region, in original image pixels. */
export function rectCenter(rect: Rectangle): Point {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Rotate a point clockwise around a center, by `degrees`. */
export function rotatePoint(point: Point, center: Point, degrees: number): Point {
    if (degrees === 0) return { x: point.x, y: point.y };

    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
    };
}

/** Inverse of {@link rotatePoint}: bring a point back into the region's unrotated space. */
export function inverseRotatePoint(point: Point, center: Point, degrees: number): Point {
    return rotatePoint(point, center, -degrees);
}

/**
 * Whether a point (in original image pixels) falls inside a region.
 * Rotation-aware: the point is brought back into the unrotated space first.
 *
 * Note: deliberately does NOT use `getBoundingClientRect()` — for a transformed
 * element that returns the axis-aligned bounding box of the rotated shape, which
 * is roughly 41% too large at 45°.
 */
export function hitTestRect(point: Point, rect: Rectangle): boolean {
    const rotation = normalizeRotation(rect.rotation);
    const target = rotation === 0 ? point : inverseRotatePoint(point, rectCenter(rect), rotation);

    return (
        target.x >= rect.x && target.x <= rect.x + rect.width && target.y >= rect.y && target.y <= rect.y + rect.height
    );
}

/**
 * Topmost region under the given point.
 *
 * Iteration order is intentionally the array order: the overlay stack assigns
 * `zIndex = rectangles.length - index`, so index 0 is the topmost layer. Keeping
 * this in sync with the render order is what makes clicks land on the right region.
 */
export function findRectAt(point: Point, rectangles: readonly Rectangle[]): Rectangle | undefined {
    return rectangles.find((rect) => hitTestRect(point, rect));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Keep a region inside the image bounds.
 * `bounds` is the size of the original image.
 */
export function clampRectToImage(rect: Rectangle, bounds: Size): Rectangle {
    const width = Math.min(rect.width, Math.max(MIN_RECT_SIZE, bounds.width));
    const height = Math.min(rect.height, Math.max(MIN_RECT_SIZE, bounds.height));

    return {
        ...rect,
        x: clamp(rect.x, 0, Math.max(0, bounds.width - width)),
        y: clamp(rect.y, 0, Math.max(0, bounds.height - height)),
        width,
        height,
    };
}

/**
 * Resolve a region resize from the starting geometry plus a pointer delta.
 *
 * Avatar regions lock their aspect ratio (based on the measured avatar size,
 * falling back to the style size) and anchor at the top-left corner.
 */
export function calculateResizedRect(
    rect: Rectangle,
    handle: ResizeHandle,
    delta: Point,
    bounds: Size,
    avatarNatural?: Size,
): Rectangle {
    let { x, y, width, height } = rect;

    const maxWidth = (left: number) => Math.max(MIN_RECT_SIZE, bounds.width - left);
    const maxHeight = (top: number) => Math.max(MIN_RECT_SIZE, bounds.height - top);
    const clampWidth = (value: number, left: number) => clamp(value, MIN_RECT_SIZE, maxWidth(left));
    const clampHeight = (value: number, top: number) => clamp(value, MIN_RECT_SIZE, maxHeight(top));
    const maxLeft = rect.x + rect.width - MIN_RECT_SIZE;
    const maxTop = rect.y + rect.height - MIN_RECT_SIZE;

    switch (handle) {
        case "right":
            width = clampWidth(rect.width + delta.x, rect.x);
            break;
        case "left":
            x = clamp(rect.x + delta.x, 0, maxLeft);
            width = clampWidth(rect.width - (x - rect.x), x);
            break;
        case "bottom":
            height = clampHeight(rect.height + delta.y, rect.y);
            break;
        case "top":
            y = clamp(rect.y + delta.y, 0, maxTop);
            height = clampHeight(rect.height - (y - rect.y), y);
            break;
        case "top-left":
            x = clamp(rect.x + delta.x, 0, maxLeft);
            y = clamp(rect.y + delta.y, 0, maxTop);
            width = clampWidth(rect.width - (x - rect.x), x);
            height = clampHeight(rect.height - (y - rect.y), y);
            break;
        case "top-right":
            y = clamp(rect.y + delta.y, 0, maxTop);
            width = clampWidth(rect.width + delta.x, rect.x);
            height = clampHeight(rect.height - (y - rect.y), y);
            break;
        case "bottom-left":
            x = clamp(rect.x + delta.x, 0, maxLeft);
            width = clampWidth(rect.width - (x - rect.x), x);
            height = clampHeight(rect.height + delta.y, rect.y);
            break;
        case "bottom-right":
            width = clampWidth(rect.width + delta.x, rect.x);
            height = clampHeight(rect.height + delta.y, rect.y);
            break;
    }

    if (rect.type === RectangleType.Avatar) {
        // Width drives the locked height, then the width is recomputed from it so
        // that rounding never leaves the pair off-ratio. Both passes clamp to the image bounds.
        const naturalWidth = avatarNatural?.width;
        const naturalHeight = avatarNatural?.height;
        const ratio =
            naturalWidth && naturalHeight && naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1;

        // Anchored at top-left, which keeps the constraint simple.
        const anchorX = rect.x;
        const anchorY = rect.y;

        let lockedHeight = clampHeight(Math.round(width / ratio), anchorY);
        lockedHeight = clamp(lockedHeight, MIN_RECT_SIZE, maxHeight(anchorY));
        let lockedWidth = clampWidth(Math.round(lockedHeight * ratio), anchorX);
        lockedWidth = clamp(lockedWidth, MIN_RECT_SIZE, maxWidth(anchorX));
        lockedHeight = clamp(Math.round(lockedWidth / ratio), MIN_RECT_SIZE, maxHeight(anchorY));

        x = anchorX;
        y = anchorY;
        width = lockedWidth;
        height = lockedHeight;
    }

    return {
        ...rect,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
    };
}

/** Anchor point of each handle, as a percentage of the region box. */
const HANDLE_ANCHORS: Record<ResizeHandle, Point> = {
    "top-left": { x: 0, y: 0 },
    top: { x: 50, y: 0 },
    "top-right": { x: 100, y: 0 },
    right: { x: 100, y: 50 },
    "bottom-right": { x: 100, y: 100 },
    bottom: { x: 50, y: 100 },
    "bottom-left": { x: 0, y: 100 },
    left: { x: 0, y: 50 },
};

/** Outward normal of each handle at 0°, in degrees. */
const HANDLE_BASE_ANGLE: Record<ResizeHandle, number> = {
    right: 0,
    "bottom-right": 45,
    bottom: 90,
    "bottom-left": 135,
    left: 180,
    "top-left": 225,
    top: 270,
    "top-right": 315,
};

/** The four resize cursors, repeated around the circle as the angle increases. */
const RESIZE_CURSORS = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize"] as const;

/**
 * Map a handle to a resize cursor, accounting for the region's rotation.
 * Snapped to the nearest 45° so the cursor always matches one of the four axes.
 */
export function cursorForRotatedHandle(handle: ResizeHandle, degrees: number): string {
    const base = HANDLE_BASE_ANGLE[handle] + degrees;
    const snapped = (Math.round((((base % 360) + 360) % 360) / 45) * 45) % 360;
    // The four cursors repeat every 180°, so the 8 octants map onto 4 indices.
    return RESIZE_CURSORS[(snapped / 45) % RESIZE_CURSORS.length];
}

export interface HandlePlacement {
    handle: ResizeHandle;
    /** Percentage anchor within the region box. */
    left: string;
    top: string;
    cursor: string;
}

/**
 * Handles to render for a region.
 * Avatar regions only expose the bottom-right corner, since their aspect ratio is locked.
 *
 * Positions are expressed as percentages so they follow the region under any
 * rotation — the browser hit-tests transformed descendants correctly, so no
 * extra math is needed for pointer interaction.
 */
export function resizeHandles(rect: Rectangle): HandlePlacement[] {
    const handles: ResizeHandle[] =
        rect.type === RectangleType.Avatar ? ["bottom-right"] : (Object.keys(HANDLE_ANCHORS) as ResizeHandle[]);

    const rotation = normalizeRotation(rect.rotation);

    return handles.map((handle) => ({
        handle,
        left: `${HANDLE_ANCHORS[handle].x}%`,
        top: `${HANDLE_ANCHORS[handle].y}%`,
        cursor: cursorForRotatedHandle(handle, rotation),
    }));
}

/**
 * Keep the minimum touch target without shifting the region.
 *
 * The previous implementation grew `width`/`height` only, which left the top-left
 * corner anchored and made the visible box drift out of sync with the region once
 * a rotation was involved. Expanding symmetrically keeps the box centered on the
 * same spot.
 */
export function touchTargetSize(size: number, minSize: number): number {
    return Math.max(size, minSize);
}
