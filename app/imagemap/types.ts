/**
 * ImageMap Editor 共用数据结构定义
 */

/**
 * 一个矩形区域。
 */
export interface Rectangle {
    /** 区分区域的唯一 ID */
    id: string;
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
export function validateImageMapConfig(data: unknown): data is ImageMapConfig {
    if (!data || typeof data !== "object") return false;

    const obj = data as Record<string, unknown>;

    // 验证 rectangles 数组
    if (!Array.isArray(obj.rectangles)) return false;

    for (const rect of obj.rectangles) {
        if (!rect || typeof rect !== "object") return false;

        const r = rect as Record<string, unknown>;

        // 类型验证
        if (
            typeof r.id !== "string" ||
            typeof r.x !== "number" ||
            typeof r.y !== "number" ||
            typeof r.width !== "number" ||
            typeof r.height !== "number" ||
            typeof r.href !== "string" ||
            typeof r.alt !== "string"
        ) {
            return false;
        }

        // 基本数值范围
        // TODO: 依然可能导入超图像范围的数据
        if (r.x < 0 || r.y < 0 || r.width < 0 || r.height < 0) {
            return false;
        }
    }

    // 验证可选字段
    // TODO: 其他需要的规则？
    if (obj.imagePath !== undefined && typeof obj.imagePath !== "string") return false;
    if (obj.imageName !== undefined && typeof obj.imageName !== "string") return false;
    return !(obj.mapName !== undefined && typeof obj.mapName !== "string");
}
