/**
 * ImageMap Editor 共用数据结构定义
 */

import { ValidationResult } from "@/lib/validation";
import type { Avatar } from "@/app/avatar/types";

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
 * @returns `true` 为有效，否则为 `false`
 */
export function validateImageMapConfig(data: unknown): ValidationResult {
    if (!data || typeof data !== "object") return { success: false };

    const obj = data as Record<string, unknown>;

    // 验证 rectangles 数组
    if (!Array.isArray(obj.rectangles)) return { success: false, message: "区域列表必须是数组" };

    for (const rect of obj.rectangles) {
        if (!rect || typeof rect !== "object") return { success: false, message: "什么东西混进去了" };

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
            return { success: false, message: `矩形字段缺失或类型不正确：${String(r.id)}` };
        }

        if (r.type !== RectangleType.MapArea && r.type !== RectangleType.Avatar) {
            return { success: false, message: `不支持的区域类型：${String(r.type)}` };
        }

        // 基本数值范围
        // TODO: 依然可能导入超图像范围的数据
        if ((r.x as number) < 0 || (r.y as number) < 0 || (r.width as number) < 0 || (r.height as number) < 0) {
            return { success: false, message: `区域位置信息不合理：${String(r.id)}` };
        }

        // Avatar 类型的附加验证
        if (r.type === RectangleType.Avatar) {
            const avatar = (r as any).avatar as Avatar | undefined;
            if (avatar) {
                if (typeof avatar.styleKey !== "string"
                    || typeof avatar.imageUrl !== "string"
                    || typeof avatar.username !== "string"
                    || (avatar.countryCode !== undefined && typeof avatar.countryCode !== "string")) {
                    return { success: false, message: `Avatar 区域配置无效：${String(r.id)}` };
                }
            }
        }
    }

    // 验证可选字段
    // TODO: 其他需要的规则？
    if ((obj.imagePath !== undefined && typeof obj.imagePath !== "string")
        || (obj.imageName !== undefined && typeof obj.imageName !== "string")
        || (obj.mapName !== undefined && typeof obj.mapName !== "string")) {
        return { success: false, message: "缺少 ImageMap 属性数据，或类型不正确" };
    }

    return { success: true };
}
