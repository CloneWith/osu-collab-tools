/**
 * 表示验证结果，用于导入等验证过程方法
 */
export interface ValidationResult {
    /** 验证是否通过 */
    success: boolean;

    /** 验证附带的消息，用于显示 */
    messageKey?: string;

    /** 附加信息，用于 l10n */
    details?: ValidationDetails;
}

export type ValidationDetails = Record<string, string | number>;

const WINDOWS_RESERVED_FILENAME_REGEX = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const INVALID_FILENAME_CHARS_REGEX = /[<>:"/\\|?*\u0000-\u001F]/;
const PATH_TRAVERSAL_REGEX = /(^|[\\/])\.\.([\\/]|$)/;
const BIDI_OVERRIDE_CHARS_REGEX = /[\u202A-\u202E\u2066-\u2069]/;
const filenameByteEncoder = new TextEncoder();

export function validateFilename(input: string): ValidationResult {
    // Reject filenames with surrounding whitespaces
    if (input.startsWith(" ") || input.endsWith(" ")) {
        return { success: false, messageKey: "surroundingWhitespace" };
    }

    const trimmed = input.trim();

    if (trimmed.length === 0) {
        return { success: false, messageKey: "filenameEmpty" };
    }

    if (filenameByteEncoder.encode(trimmed).length > 127) {
        return { success: false, messageKey: "filenameTooLong" };
    }

    if (trimmed === "." || trimmed === "..") {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (PATH_TRAVERSAL_REGEX.test(trimmed) || trimmed.includes("../") || trimmed.includes("..\\")) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (trimmed.includes("/") || trimmed.includes("\\")) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (INVALID_FILENAME_CHARS_REGEX.test(trimmed)) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (trimmed.includes(":")) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (/[\u007F]/.test(trimmed)) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (BIDI_OVERRIDE_CHARS_REGEX.test(trimmed)) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (WINDOWS_RESERVED_FILENAME_REGEX.test(trimmed)) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    if (trimmed.endsWith(".") || trimmed.endsWith(" ")) {
        return { success: false, messageKey: "filenameInvalid" };
    }

    return { success: true };
}
