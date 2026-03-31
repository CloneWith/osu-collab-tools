export async function waitForAnimationFrames(frameCount: number = 2): Promise<void> {
    const steps = Math.max(1, frameCount);

    for (let i = 0; i < steps; i++) {
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    }
}
