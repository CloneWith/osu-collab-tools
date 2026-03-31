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
