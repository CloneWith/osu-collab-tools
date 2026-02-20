/**
 * ImageMap Editor 共用数据结构定义
 */

import { ValidationResult } from "@/lib/validation";
import type { Avatar } from "@/app/avatar/types";
import { parse } from "@bbob/parser";
import { generateId } from "@/lib/utils";

/**
 * 一个矩形区域。
 */
export interface Rectangle {
    /** 区分区域的唯一 ID */
    id: string;
    /** 该区域的类型 */
    type: RectangleType;
    /** 区域左上角的 X 坐标 */
    x: number;
    /** 区域左上角的 Y 坐标 */
    y: number;
    /** 区域宽度 */
    width: number;
    /** 区域高度 */
    height: number;
    /** 区域指向的链接 */
    href: string;
    /** 区域显示的备选文本 */
    alt: string;
    /** Avatar 类型的附加配置（仅当 type 为 Avatar 时生效） */
    avatar?: Avatar;
}

export enum RectangleType {
    /** 一般矩形区域 */
    MapArea = "map-area",

    /** 头像映射区 */
    Avatar = "avatar"
}

/**
 * ImageMap 配置数据结构
 * 用于导出、导入和编辑器状态管理
 */
export interface ImageMapConfig {
    /** 给定的图像路径（用户设置，图床等） */
    imagePath?: string;
    /** 图像名称（可能并不重要...） */
    imageName?: string;
    /** 自定义的 Imagemap 名称 */
    mapName?: string;
    /** Imagemap 中的所有区域 */
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
    if (!data || typeof data !== "object") return {success: false};

    const obj = data as Record<string, unknown>;

    // 验证 rectangles 数组
    if (!Array.isArray(obj.rectangles)) return {success: false, messageKey: "check.expectsArrayForAreas"};

    for (const rect of obj.rectangles) {
        if (!rect || typeof rect !== "object") return {success: false, messageKey: "check.invalidAreaEntry"};

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
            return {success: false, messageKey: "check.invalidAttrInArea", details: {id: String(r.id)}};
        }

        if (r.type !== RectangleType.MapArea && r.type !== RectangleType.Avatar) {
            return {
                success: false,
                messageKey: "check.invalidAreaType",
                details: {id: String(r.id), type: String(r.type)},
            };
        }

        // 基本数值范围
        if ((r.x as number) < 0 || (r.y as number) < 0 || (r.width as number) < 0 || (r.height as number) < 0) {
            return {success: false, messageKey: "check.invalidAreaPosition", details: {id: String(r.id)}};
        }

        if (r.x + r.width > width || r.y + r.height > height) {
            const sizePrompt: string[] = [];

            if (r.x + r.width > width) sizePrompt.push(`${r.x} + ${r.width} > ${width}`);
            if (r.y + r.height > height) sizePrompt.push(`${r.y} + ${r.height} > ${height}`);
            return {
                success: false,
                messageKey: "check.areaSizeOutOfRange",
                details: {id: String(r.id), details: sizePrompt.join(", ")},
            };
        }
    }

    // 验证可选字段
    // TODO: 其他需要的规则？
    if ((obj.imagePath !== undefined && typeof obj.imagePath !== "string")
        || (obj.imageName !== undefined && typeof obj.imageName !== "string")
        || (obj.mapName !== undefined && typeof obj.mapName !== "string")) {
        return {success: false, messageKey: "check.invalidImagemapAttr"};
    }

    return {success: true};
}

export interface ImageMapBBCodeParseResult extends ValidationResult {
    config?: ImageMapConfig;
}

/**
 * 解析并验证 imagemap BBCode 内容，使用图像宽高将区域信息标准化。
 */
export function parseImageMapBBCode(bbcode: string, width: number, height: number): ImageMapBBCodeParseResult {
    let parseError: { line: number, col: number } | undefined;

    let ast;
    try {
        ast = parse(bbcode, {
            onlyAllowTags: ["imagemap"],
            onError: (err) => {
                parseError = {line: err.lineNumber, col: err.columnNumber};
            },
        });
    } catch (error) {
        return {success: false, messageKey: error instanceof Error ? error.message : "无法解析 BBCode"};
    }

    if (parseError) return {success: false, messageKey: "check.bbcodeParsingError", details: parseError};

    if (!ast.some((n) => n.tag === "imagemap")) {
        return {success: false, messageKey: "check.imagemapTagRequired"};
    }

    if (ast.length !== 1) {
        return {success: false, messageKey: "check.multipleTagsPresent"};
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
        return {success: false, messageKey: "check.imagemapContentRequired"};
    }

    const imagePath = lines[0];
    try {
        // 验证为合法链接
        new URL(imagePath);
    } catch {
        return {success: false, messageKey: "check.topLinkRequired"};
    }

    const rectangles: ImageMapConfig["rectangles"] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        if (parts.length < 5 || parts.length > 6) {
            return {success: false, messageKey: "check.invalidAreaDefinition", details: {line: i}};
        }

        const [xStr, yStr, wStr, hStr, href, alt] = parts;
        const numbers = [xStr, yStr, wStr, hStr].map((n) => Number.parseFloat(n));

        if (numbers.some((n) => Number.isNaN(n))) {
            return {success: false, messageKey: "check.invalidSizeDefinition", details: {line: i}};
        }

        rectangles.push({
            id: generateId(`rect-${Date.now()}-${i}`),
            type: RectangleType.MapArea,
            // 注意：BBCode imagemap 区域使用的是百分比
            x: Math.round(numbers[0] / 100 * width),
            y: Math.round(numbers[1] / 100 * height),
            width: Math.round(numbers[2] / 100 * width),
            height: Math.round(numbers[3] / 100 * height),
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

