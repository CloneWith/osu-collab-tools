import { waitForAnimationFrames } from "@/lib/render/wait-for-paint";
import { snapdom } from "@zumer/snapdom";

type SnapdomResult = Awaited<ReturnType<typeof snapdom>>;

interface CaptureOptions {
    waitFrames?: number;
    snapdomOptions?: Parameters<typeof snapdom>[1];
}

interface DownloadOptions extends CaptureOptions {
    downloadOptions: Parameters<SnapdomResult["download"]>[0];
}

interface DataUrlOptions extends CaptureOptions {
    format: string;
    quality?: number;
    exportOptions?: Parameters<SnapdomResult["toPng"]>[0];
}

export async function captureElementWithSnapdom(
    element: HTMLElement,
    options: CaptureOptions = {},
): Promise<SnapdomResult> {
    const { waitFrames = 0, snapdomOptions } = options;

    if (waitFrames > 0) {
        await waitForAnimationFrames(waitFrames);
    }

    return snapdom(element, snapdomOptions);
}

export async function downloadElementSnapshot(element: HTMLElement, options: DownloadOptions): Promise<SnapdomResult> {
    const result = await captureElementWithSnapdom(element, options);
    await result.download(options.downloadOptions);
    return result;
}

export async function exportElementSnapshotDataUrl(
    element: HTMLElement,
    options: DataUrlOptions,
): Promise<string | null> {
    const { format, quality, exportOptions } = options;
    const result = await captureElementWithSnapdom(element, options);

    if (format === "image/jpeg") {
        const image = await result.toJpeg({
            ...exportOptions,
            quality: quality === undefined ? undefined : Math.max(0, Math.min(1, quality / 100)),
        });
        return image?.src ?? null;
    }

    if (format === "image/webp") {
        const image = await result.toWebp({
            ...exportOptions,
            quality: quality === undefined ? undefined : Math.max(0, Math.min(1, quality / 100)),
        });
        return image?.src ?? null;
    }

    const image = await result.toPng(exportOptions);
    return image?.src ?? null;
}
