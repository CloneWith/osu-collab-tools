"use client";

import { ZOOM_MAX, ZOOM_MIN } from "@/app/imagemap/editor/geometry";
import type { ViewportZoomApi } from "@/app/imagemap/editor/use-viewport-zoom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";

const PRESETS = [25, 50, 100, 200, 400];

/**
 * Bounded zoom controls.
 *
 * Buttons and the slider are the primary controls; `Ctrl + wheel` is a convenience
 * on top. Firefox and Safari reserve that gesture for their own page zoom, so it
 * cannot be the only way to zoom.
 */
export function ZoomControls({ zoom }: { zoom: ViewportZoomApi }) {
  const t = useTranslations("imagemap");

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!zoom.hasImage || !zoom.canZoomOut}
        aria-label={t("zoom.out")}
        onClick={() => zoom.step(-1)}
      >
        <ZoomOut className="size-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="min-w-20 font-mono text-xs tabular-nums"
            disabled={!zoom.hasImage}
            aria-label={t("zoom.label")}
          >
            {zoom.percent}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3">
          <Slider
            value={[zoom.percent]}
            min={ZOOM_MIN * 100}
            max={ZOOM_MAX * 100}
            step={1}
            onValueChange={(value) => zoom.setPercent(value[0])}
            aria-label={t("zoom.label")}
          />

          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={zoom.isFit ? "secondary" : "outline"}
              className="gap-1"
              onClick={zoom.fit}
            >
              <Scan className="size-4" />
              {t("zoom.fit")}
            </Button>
            <Button
              size="sm"
              variant={
                !zoom.isFit && zoom.percent === 100 ? "secondary" : "outline"
              }
              onClick={zoom.actual}
            >
              {t("zoom.actual")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant={
                  !zoom.isFit && zoom.percent === preset
                    ? "secondary"
                    : "outline"
                }
                className="font-mono text-xs tabular-nums"
                onClick={() => zoom.setPercent(preset)}
              >
                {preset}%
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{t("zoom.hint")}</p>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!zoom.hasImage || !zoom.canZoomIn}
        aria-label={t("zoom.in")}
        onClick={() => zoom.step(1)}
      >
        <ZoomIn className="size-4" />
      </Button>
    </div>
  );
}
