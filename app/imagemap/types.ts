/**
 * Shared data structures for the imagemap editor.
 */

import type { Avatar } from "@/app/avatar/types";
import type { MappableArea } from "@/lib/imagemap/types";
import { generateId } from "@/lib/utils";
import type { ValidationResult } from "@/lib/validation";
import { parse } from "@bbob/parser";
import type { TagNode } from "@bbob/types";

/**
 * A single editable rectangular area on the imagemap.
 */
export interface Rectangle extends MappableArea {
    /** Unique identifier for list operations, selection, and serialization. */
    id: string;
    /** Functional area type. */
    type: RectangleType;
    /** Avatar-specific payload, valid only when type is Avatar. */
    avatar?: Avatar;
}

export enum RectangleType {
    /** Generic rectangular map area. */
    MapArea = "map-area",

    /** Avatar-rendered mapped area. */
    Avatar = "avatar",
}

/**
 * Persisted imagemap configuration used for export/import and editor state restore.
 */
export interface ImageMapConfig {
    /** Resolved image URL/path used as the map background. */
    imagePath?: string;
    /** Optional image file/display name. */
    imageName?: string;
    /** Optional custom <map name> value. */
    mapName?: string;
    /** All defined map rectangles. */
    rectangles: Rectangle[];
}

/**
 * 验证给定的数据是否是有效的 Imagemap 配置。
 * @param data 待验证的数据
 * @param width 图像宽度
 * @param height 图像高度
 * @returns `true` 为有效，否则为 `false`
 */
export function validateImageMapJsonConfig(data: unknown, width: number, height: number): ValidationResult {
    if (!data || typeof data !== "object") return { success: false };

    const obj = data as Record<string, unknown>;

    // 验证 rectangles 数组
    if (!Array.isArray(obj.rectangles)) return { success: false, messageKey: "check.expectsArrayForAreas" };

    for (const rect of obj.rectangles) {
        if (!rect || typeof rect !== "object") return { success: false, messageKey: "check.invalidAreaEntry" };

        const r = rect as Record<string, unknown>;

        // 基本字段验证
        if (
            typeof r.id !== "string" ||
            typeof r.type !== "string" ||
            typeof r.x !== "number" ||
            typeof r.y !== "number" ||
            typeof r.width !== "number" ||
            typeof r.height !== "number" ||
            typeof r.href !== "string" ||
            typeof r.alt !== "string"
        ) {
            return {
                success: false,
                messageKey: "check.invalidAttrInArea",
                details: { id: String(r.id) },
            };
        }

        if (r.type !== RectangleType.MapArea && r.type !== RectangleType.Avatar) {
            return {
                success: false,
                messageKey: "check.invalidAreaType",
                details: { id: String(r.id), type: String(r.type) },
            };
        }

        // 基本数值范围
        if ((r.x as number) < 0 || (r.y as number) < 0 || (r.width as number) < 0 || (r.height as number) < 0) {
            return {
                success: false,
                messageKey: "check.invalidAreaPosition",
                details: { id: String(r.id) },
            };
        }

        if (r.x + r.width > width || r.y + r.height > height) {
            const sizePrompt: string[] = [];

            if (r.x + r.width > width) sizePrompt.push(`${r.x} + ${r.width} > ${width}`);
            if (r.y + r.height > height) sizePrompt.push(`${r.y} + ${r.height} > ${height}`);
            return {
                success: false,
                messageKey: "check.areaSizeOutOfRange",
                details: { id: String(r.id), details: sizePrompt.join(", ") },
            };
        }
    }

    // 验证可选字段
    // TODO: 其他需要的规则？
    if (
        (obj.imagePath !== undefined && typeof obj.imagePath !== "string") ||
        (obj.imageName !== undefined && typeof obj.imageName !== "string") ||
        (obj.mapName !== undefined && typeof obj.mapName !== "string")
    ) {
        return { success: false, messageKey: "check.invalidImagemapAttr" };
    }

    return { success: true };
}

export interface ImageMapBBCodeParseResult extends ValidationResult {
    /** Parsed and normalized config when parsing succeeds. */
    config?: ImageMapConfig;
}

/**
 * 解析并验证 imagemap BBCode 内容，使用图像宽高将区域信息标准化。
 */
export function parseImageMapBBCode(bbcode: string, width: number, height: number): ImageMapBBCodeParseResult {
    let parseError: { line: number; col: number } | undefined;

    let ast: TagNode[];
    try {
        ast = parse(bbcode, {
            onlyAllowTags: ["imagemap"],
            onError: (err) => {
                parseError = { line: err.lineNumber, col: err.columnNumber };
            },
        });
    } catch (error) {
        return {
            success: false,
            messageKey: error instanceof Error ? error.message : "无法解析 BBCode",
        };
    }

    if (parseError)
        return {
            success: false,
            messageKey: "check.bbcodeParsingError",
            details: parseError,
        };

    if (!ast.some((n) => n.tag === "imagemap")) {
        return { success: false, messageKey: "check.imagemapTagRequired" };
    }

    if (ast.length !== 1) {
        return { success: false, messageKey: "check.multipleTagsPresent" };
    }

    const root = ast[0];

    const content = Array.isArray(root.content) ? root.content : [];
    const rawText = content
        .map((c: unknown) => (typeof c === "string" || typeof c === "number" ? String(c) : ""))
        .join("");

    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) {
        return { success: false, messageKey: "check.imagemapContentRequired" };
    }

    const imagePath = lines[0];
    try {
        // 验证为合法链接
        new URL(imagePath);
    } catch {
        return { success: false, messageKey: "check.topLinkRequired" };
    }

    const rectangles: ImageMapConfig["rectangles"] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        if (parts.length < 5 || parts.length > 6) {
            return {
                success: false,
                messageKey: "check.invalidAreaDefinition",
                details: { line: i },
            };
        }

        const [xStr, yStr, wStr, hStr, href, alt] = parts;
        const numbers = [xStr, yStr, wStr, hStr].map((n) => Number.parseFloat(n));

        if (numbers.some((n) => Number.isNaN(n))) {
            return {
                success: false,
                messageKey: "check.invalidSizeDefinition",
                details: { line: i },
            };
        }

        rectangles.push({
            id: generateId(`rect-${Date.now()}-${i}`),
            type: RectangleType.MapArea,
            // 注意：BBCode imagemap 区域使用的是百分比
            x: Math.round((numbers[0] / 100) * width),
            y: Math.round((numbers[1] / 100) * height),
            width: Math.round((numbers[2] / 100) * width),
            height: Math.round((numbers[3] / 100) * height),
            href,
            alt: alt ?? "",
        });
    }

    return {
        success: true,
        config: {
            imagePath,
            rectangles,
        },
    };
}
