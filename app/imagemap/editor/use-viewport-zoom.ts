"use client";

import {
    clampZoom,
    computeFitZoom,
    type Point,
    type Size,
    ZOOM_MAX,
    ZOOM_MIN,
} from "@/app/imagemap/editor/geometry";
import type React from "react";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

/** Multiplicative step applied by the zoom in / zoom out buttons. */
const ZOOM_STEP = 1.25;

export interface ViewportZoomApi {
    /** Effective zoom factor. */
    zoom: number;
    /** Effective zoom as a whole percentage, for display. */
    percent: number;
    /** Whether the zoom currently follows the viewport size. */
    isFit: boolean;
    canZoomIn: boolean;
    canZoomOut: boolean;
    /** Whether the natural image size is known yet. */
    hasImage: boolean;
    /** Set an absolute percentage, leaving fit mode. */
    setPercent: (percent: number, anchorViewport?: Point) => void;
    /** Zoom in or out by one step, leaving fit mode. */
    step: (direction: 1 | -1, anchorViewport?: Point) => void;
    /** Follow the viewport size. */
    fit: () => void;
    /** Render at 1:1 image pixels, leaving fit mode. */
    actual: () => void;
    /** Zoom by a factor around a viewport point, leaving fit mode. */
    zoomAtViewportPoint: (viewportPoint: Point, factor: number) => void;
    /** The scrolling viewport. */
    scrollRef: React.RefObject<HTMLDivElement | null>;
    /** The fixed-size stage that holds the image and the region overlays. */
    stageRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Drives the preview zoom.
 *
 * The zoom factor is the single source of truth for preview scaling: region
 * overlays are sized with `rect.x * zoom` and pointer coordinates are mapped back
 * with `(client - imgRect.left) / zoom`. Nothing reads the rendered image size, so
 * there is no feedback loop between layout and state.
 *
 * Fit zoom is **derived during render, never stored**. An earlier version kept
 * `fitZoom` in state and recomputed it from an effect keyed on the viewport size,
 * which fought the user: zooming in grew the image, a scrollbar appeared, the
 * viewport content box shrank, the effect refired and snapped the zoom straight back
 * to fit. With fit computed inline, no effect can override a manual zoom and
 * scrollbar churn cannot reach the zoom at all.
 */
export function useViewportZoom({
    natural,
    interactionActive,
}: {
    natural: Size;
    /** True while drawing, moving, resizing or panning — suppresses anchor corrections. */
    interactionActive: boolean;
}): ViewportZoomApi {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);

    const [mode, setMode] = useState<"fit" | "manual">("fit");
    const [manualZoom, setManualZoom] = useState(1);
    const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });

    const hasImage = natural.width > 0 && natural.height > 0;
    const viewportReady = viewport.width > 0 && viewport.height > 0;

    // Derived, not state. Guarded so the very first frame of a newly loaded image
    // renders at 100% rather than at a meaningless fit of an unmeasured viewport.
    const fitZoom = useMemo(() => {
        if (!hasImage || !viewportReady) return 1;
        return computeFitZoom(natural, viewport);
    }, [hasImage, natural, viewport, viewportReady]);

    const zoom = hasImage
        ? clampZoom(mode === "fit" ? fitZoom : manualZoom)
        : 1;

    /** Image-space point under a viewport point, captured before the zoom changes. */
    const pendingAnchorRef = useRef<{ image: Point; viewport: Point } | null>(
        null,
    );

    const captureAnchor = useCallback(
        (viewportPoint?: Point) => {
            const stage = stageRef.current;
            if (!viewportPoint || !stage) return;

            const rect = stage.getBoundingClientRect();
            pendingAnchorRef.current = {
                image: {
                    x: (viewportPoint.x - rect.left) / zoom,
                    y: (viewportPoint.y - rect.top) / zoom,
                },
                viewport: viewportPoint,
            };
        },
        [zoom],
    );

    const applyZoom = useCallback(
        (next: number, viewportPoint?: Point) => {
            captureAnchor(viewportPoint);
            setMode("manual");
            setManualZoom(clampZoom(next));
        },
        [captureAnchor],
    );

    /**
     * Keep the image point that was under the cursor pinned to the same viewport
     * position across a zoom change. Runs before paint so no intermediate frame is
     * visible; the browser clamps the resulting scroll offsets on its own.
     */
    useLayoutEffect(() => {
        const anchor = pendingAnchorRef.current;
        const scroll = scrollRef.current;
        if (!anchor || !scroll || !hasImage || interactionActive) return;

        pendingAnchorRef.current = null;

        const contentLeft =
            scroll.getBoundingClientRect().left - scroll.scrollLeft;
        const contentTop =
            scroll.getBoundingClientRect().top - scroll.scrollTop;

        // The stage is centred with `m-auto`, so it is offset when smaller than the viewport.
        const offsetLeft = Math.max(
            0,
            (scroll.clientWidth - natural.width * zoom) / 2,
        );
        const offsetTop = Math.max(
            0,
            (scroll.clientHeight - natural.height * zoom) / 2,
        );

        scroll.scrollLeft =
            contentLeft +
            offsetLeft +
            anchor.image.x * zoom -
            anchor.viewport.x;
        scroll.scrollTop =
            contentTop + offsetTop + anchor.image.y * zoom - anchor.viewport.y;
    }, [hasImage, interactionActive, natural.height, natural.width, zoom]);

    // Track the viewport content box. `contentRect` excludes scrollbars, which is what
    // "fit" should be computed against.
    //
    // `hasImage` is a dependency because the scrolling element only exists once an image
    // is loaded — without it the observer would attach to null and fit would never compute.
    //
    // A layout effect is used rather than a passive one so the measurement lands before
    // the first paint of a newly loaded image; otherwise it would flash at 100%.
    useLayoutEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.contentRect;
            if (box) setViewport({ width: box.width, height: box.height });
        });
        observer.observe(element);

        // Seed immediately: the first ResizeObserver callback is asynchronous.
        const box = element.getBoundingClientRect();
        setViewport({ width: box.width, height: box.height });

        return () => observer.disconnect();
    }, [hasImage, scrollRef]);

    // Return to fit whenever the image identity changes, so replacing an image never
    // leaves the new one at the previous one's zoom. Adjusting during render is the
    // documented "derive state from props" escape hatch and avoids an extra frame at the
    // stale zoom.
    const imageKey = hasImage ? `${natural.width}x${natural.height}` : "";
    const prevImageKeyRef = useRef(imageKey);
    if (prevImageKeyRef.current !== imageKey) {
        prevImageKeyRef.current = imageKey;
        if (mode === "manual") {
            setMode("fit");
            setManualZoom(1);
        }
    }

    const fit = useCallback(() => setMode("fit"), []);

    const setPercent = useCallback(
        (percent: number, anchorViewport?: Point) =>
            applyZoom(percent / 100, anchorViewport),
        [applyZoom],
    );

    const step = useCallback(
        (direction: 1 | -1, anchorViewport?: Point) =>
            applyZoom(
                direction === 1 ? zoom * ZOOM_STEP : zoom / ZOOM_STEP,
                anchorViewport,
            ),
        [applyZoom, zoom],
    );

    const actual = useCallback(() => applyZoom(1), [applyZoom]);

    const zoomAtViewportPoint = useCallback(
        (viewportPoint: Point, factor: number) =>
            applyZoom(zoom * factor, viewportPoint),
        [applyZoom, zoom],
    );

    /**
     * Ctrl / Cmd + wheel zooms. React's `onWheel` is registered passively on the root
     * and cannot call `preventDefault`, so the browser would also page-zoom. A native
     * non-passive listener is required.
     *
     * Firefox and Safari reserve that gesture for their own page zoom and may not
     * deliver it here at all, which is why the buttons and the slider are the primary
     * controls rather than an optional extra.
     */
    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            event.preventDefault();
            const delta =
                event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
            zoomAtViewportPoint(
                { x: event.clientX, y: event.clientY },
                Math.exp(-delta * 0.002),
            );
        };

        element.addEventListener("wheel", handleWheel, { passive: false });
        return () => element.removeEventListener("wheel", handleWheel);
    }, [zoomAtViewportPoint]);

    return useMemo(
        () => ({
            zoom,
            percent: Math.round(zoom * 100),
            isFit: mode === "fit",
            canZoomIn: zoom < ZOOM_MAX,
            canZoomOut: zoom > ZOOM_MIN,
            hasImage,
            setPercent,
            step,
            fit,
            actual,
            zoomAtViewportPoint,
            scrollRef,
            stageRef,
        }),
        [
            actual,
            fit,
            hasImage,
            mode,
            setPercent,
            step,
            zoom,
            zoomAtViewportPoint,
        ],
    );
}
