interface ExportErrorToastOptions {
    title: string;
    fallbackMessage: string;
    descriptionPrefix?: string;
}

/**
 * Normalizes unknown errors into a user-facing message string.
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage;
}

/**
 * Builds a destructive toast payload for export/download failures.
 */
export function buildExportErrorToast(
    options: ExportErrorToastOptions,
    error: unknown,
): {
    title: string;
    description: string;
    variant: "destructive";
} {
    const message = getErrorMessage(error, options.fallbackMessage);
    const description = options.descriptionPrefix ? `${options.descriptionPrefix}: ${message}` : message;

    return {
        title: options.title,
        description,
        variant: "destructive",
    };
}
