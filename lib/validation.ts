/**
 * 表示验证结果，用于导入等验证过程方法
 */
export interface ValidationResult {
    /** 验证是否通过 */
    success: boolean,

    /** 验证附带的消息，用于显示 */
    messageKey?: string,

    /** 附加信息，用于 l10n */
    details?: Record<string, any>,
}
