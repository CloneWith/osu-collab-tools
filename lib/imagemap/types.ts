/**
 * Base shape contract for mappable rectangular areas.
 */
export interface MappableArea {
    /** X coordinate of the top-left corner in image pixels. */
    x: number;
    /** Y coordinate of the top-left corner in image pixels. */
    y: number;
    /** Area width in image pixels. */
    width: number;
    /** Area height in image pixels. */
    height: number;
    /** Target URL to open when the area is clicked. */
    href: string;
    /** Human-readable alternative text for the area. */
    alt: string;
}
