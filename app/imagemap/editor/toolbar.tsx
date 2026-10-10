"use client";

import type { SidebarCardId } from "@/app/imagemap/editor/sidebar-cards";
import type { ViewportZoomApi } from "@/app/imagemap/editor/use-viewport-zoom";
import { ZoomControls } from "@/app/imagemap/editor/zoom-controls";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Camera, FolderOpen, FolderSync, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export interface EditorToolDef {
  key: string;
  name: string;
  icon: ReactElement;
}

/**
 * Bottom toolbar: tools, then the image picker, then the import/export and save card
 * toggles, then the zoom controls. Separators keep the groups visually distinct.
 *
 * Everything except the image picker is disabled while no image is loaded, since
 * tools, cards and zoom all act on an image that does not exist yet.
 */
export function Toolbar({
  tools,
  currentTool,
  onSelectTool,
  onImageSelected,
  onToggleCard,
  openCardStates,
  zoom,
  hasImage,
}: {
  tools: readonly EditorToolDef[];
  currentTool: string;
  onSelectTool: (tool: string) => void;
  onImageSelected: (file: File) => void;
  /** Toolbar buttons toggle the matching sidebar card, same as the rail's own toggles. */
  onToggleCard: (id: SidebarCardId) => void;
  openCardStates: Record<SidebarCardId, boolean>;
  zoom: ViewportZoomApi;
  hasImage: boolean;
}) {
  const t = useTranslations("imagemap");
  const tc = useTranslations("common");

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-1 border-t bg-card/60 p-2 select-none">
      {tools.map((tool, index) => {
        const active = currentTool === tool.key;

        return (
          <Tooltip key={tool.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t(`tools.${tool.name}`)}
                aria-pressed={active}
                disabled={!hasImage}
                className={cn(
                  // inline-flex + place-items-center keeps the glyph optically centred:
                  // a bare <button> is inline-block, so the SVG sits on the text
                  // baseline and appears nudged downwards.
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-all ease-out duration-200",
                  "disabled:pointer-events-none disabled:opacity-50",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-foreground/10",
                )}
                onClick={() => onSelectTool(tool.key)}
              >
                {tool.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {t(`tools.${tool.name}`)}{" "}
              <KbdGroup>
                <Kbd>Alt</Kbd>
                <span>+</span>
                <Kbd>{index + 1}</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
        );
      })}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* The image picker moved down from the old section header, and is the one
          control that stays enabled without an image. */}
      <label>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImageSelected(file);
            // Reset so picking the same file twice still fires a change event.
            event.target.value = "";
          }}
        />
        <Button asChild size="sm" className="gap-2">
          <span className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            {t("toolbar.selectImage")}
          </span>
        </Button>
      </label>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarCardButton
        active={openCardStates.io}
        disabled={!hasImage}
        icon={FolderSync}
        label={tc("import")}
        detail={tc("export")}
        onClick={() => onToggleCard("io")}
      />
      <ToolbarCardButton
        active={openCardStates.save}
        disabled={!hasImage}
        icon={Camera}
        label={t("toolbar.save")}
        onClick={() => onToggleCard("save")}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ZoomControls zoom={zoom} />
    </div>
  );
}

function ToolbarCardButton({
  active,
  disabled,
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "outline"}
      className="gap-2"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      {label}
      {detail && (
        <>
          <span className="text-muted-foreground">/</span>
          {detail}
        </>
      )}
    </Button>
  );
}
