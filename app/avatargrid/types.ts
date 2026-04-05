import type { AvatarGridUserModel } from "@/lib/avatar/types";
import type { MappableArea } from "@/lib/imagemap/types";

/**
 * User entry rendered as one item in the avatar grid.
 */
export interface GridUser extends AvatarGridUserModel {
    /** Unique local identifier used for editing, selection, and caching. */
    id: string;
}

/**
 * Layout options for the avatar grid container.
 */
export interface GridLayout {
    /** Number of columns in the grid. */
    columns: number;
    /** Gap between grid items in pixels. */
    gap: number;
    /** Inner padding of the preview container in pixels. */
    padding: number;
}

/**
 * Background appearance settings for the preview/export canvas.
 */
export interface BackgroundConfig {
    /** Background rendering mode. */
    type: "color" | "image" | "gradient";
    /** Solid background color (hex/rgb string). */
    color: string;
    /** Optional background image URL/data URL. */
    imageUrl?: string;
    /** Gradient start color. */
    gradientFrom?: string;
    /** Gradient end color. */
    gradientTo?: string;
    /** Gradient direction keyword mapped to CSS linear-gradient syntax. */
    gradientDirection?: "to-right" | "to-bottom" | "to-bottom-right" | "to-bottom-left";
}

/**
 * Output options for image export.
 */
export interface ExportConfig {
    /** File name without extension. */
    filename: string;
    /** Output image format. */
    format: "png" | "jpeg" | "webp";
    /** Compression quality in range [0, 1] for lossy formats. */
    quality: number;
    /** Pixel scale multiplier applied during export. */
    scale: number;
}

/**
 * Concrete imagemap area generated from a grid item.
 */
export interface ImageMapArea extends MappableArea {
    /** Unique area identifier used for referencing generated map entries. */
    id: string;
}
