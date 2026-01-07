export interface Avatar {
    /** 头像图片链接 */
    imageUrl: string;
    /** 用户名 */
    username: string;
    /** 国家/地区代码（可选） */
    countryCode?: string;
    /** 样式键（如 classic/modern/simple） */
    styleKey: string;
}
