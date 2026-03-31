/**
 * Standard validation result used by input parsing/import flows.
 */
export interface ValidationResult {
    /** Whether validation succeeded. */
    success: boolean;

    /** Optional i18n message key describing the validation failure. */
    messageKey?: string;

    /** Optional interpolation payload for localized error messages. */
    details?: ValidationDetails;
}

/**
 * Key-value payload for localized validation messages.
 */
export type ValidationDetails = Record<string, string | number>;

const WINDOWS_RESERVED_FILENAME_REGEX = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const INVALID_FILENAME_CHARS_REGEX = /[<>:"/\\|?*\u0000-\u001F]/;
const PATH_TRAVERSAL_REGEX = /(^|[\\/])\.\.([\\/]|$)/;
const BIDI_OVERRIDE_CHARS_REGEX = /[\u202A-\u202E\u2066-\u2069]/;
const filenameByteEncoder = new TextEncoder();

/**
 * Validates a file name for export/save operations.
 *
 * Rules include:
 * - no surrounding whitespace
 * - not empty
 * - max byte length: 127 (UTF-8)
 * - no path traversal or directory separators
 * - no control characters, bidi overrides, or Windows reserved names
 */
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
