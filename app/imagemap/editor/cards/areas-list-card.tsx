"use client";

import { RectangleType, type Rectangle } from "@/app/imagemap/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { normalizeRotation } from "@/app/imagemap/editor/geometry";
import { cn } from "@/lib/utils";
import {
  Copy,
  GripVertical,
  MoreVertical,
  MousePointerClick,
  Square,
  Trash,
  CircleUserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";

export function AreasListCard({
  rectangles,
  selectedRect,
  draggingRectId,
  listRef,
  onSelect,
  onDuplicate,
  onDelete,
  onDragStartRow,
  onDragEndRow,
  onDragOverRow,
  onDropOnRow,
  onTouchStartRow,
  onTouchMoveRow,
  onTouchEndRow,
}: {
  rectangles: Rectangle[];
  selectedRect: string | null;
  draggingRectId: string | null;
  /** Kept as a ref so the keyboard shortcut handler can detect focus inside the list. */
  listRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStartRow: (event: React.DragEvent, id: string) => void;
  onDragEndRow: () => void;
  onDragOverRow: (event: React.DragEvent, id: string) => void;
  onDropOnRow: (event: React.DragEvent, id: string) => void;
  onTouchStartRow: (id: string) => void;
  onTouchMoveRow: (event: React.TouchEvent) => void;
  onTouchEndRow: () => void;
}) {
  const t = useTranslations("imagemap");
  const tc = useTranslations("common");

  if (rectangles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MousePointerClick />
          </EmptyMedia>
          <EmptyTitle>{t("placeholder.noRectangle.title")}</EmptyTitle>
          <EmptyDescription>
            {t("placeholder.noRectangle.description")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2" ref={listRef}>
      {rectangles.map((rect, index) => {
        const rotation = normalizeRotation(rect.rotation);

        return (
          <div
            key={rect.id}
            className={cn(
              "flex w-full min-w-0 px-3 py-2 rounded-md border items-center justify-between gap-3 transition-colors",
              selectedRect === rect.id
                ? "border-primary bg-primary/15"
                : "border-border bg-card",
              draggingRectId === rect.id ? "opacity-70" : "hover:bg-primary/5",
            )}
            // A real <button> would nest the drag handle and the dropdown trigger, which are
            // themselves interactive, so the row stays a div with an explicit role.
            role="button"
            tabIndex={0}
            onClick={() => onSelect(rect.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(rect.id);
              }
            }}
            onDragOver={(e) => onDragOverRow(e, rect.id)}
            onDrop={(e) => onDropOnRow(e, rect.id)}
            data-rect-row="true"
            data-rect-id={rect.id}
          >
            <div className="flex w-full items-center gap-2 min-w-0">
              <div
                className="h-full text-muted-foreground hover:text-foreground cursor-grab shrink-0 -ml-3 pl-3 py-2 rounded-md"
                onDragStart={(e) => onDragStartRow(e, rect.id)}
                onDragEnd={onDragEndRow}
                draggable
                role="button"
                aria-label={t("rectAttrs.dragPrompt")}
                tabIndex={-1}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTouchStartRow(rect.id);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  onTouchMoveRow(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onTouchEndRow();
                }}
                style={{ touchAction: "none" }}
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {rect.type === RectangleType.Avatar ? (
                <CircleUserRound />
              ) : (
                <Square />
              )}

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-left truncate">
                  {rect.alt || t("rectAttrs.defaultName", { index: index + 1 })}
                </span>
                <span
                  className={cn(
                    "text-xs text-muted-foreground text-left truncate",
                    !rect.href && "italic",
                  )}
                >
                  {rect.href || t("rectAttrs.unsetLink")}
                </span>
              </div>

              {/* Only avatar areas can be rotated; show the angle when set. */}
              {rotation !== 0 && (
                <span className="shrink-0 rounded bg-primary/15 px-1 font-mono text-xs text-primary tabular-nums">
                  {rotation}°
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onDuplicate(rect.id);
                  }}
                >
                  <Copy className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tc("duplicate")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    onDelete(rect.id);
                  }}
                >
                  <Trash className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tc("delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
