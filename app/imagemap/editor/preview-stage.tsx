"use client";

import DragAndDropOverlay, {
  type DnDRejectReason,
} from "@/app/imagemap/dnd-overlay";
import { RegionOverlay } from "@/app/imagemap/editor/region-overlay";
import type { ResizeHandle } from "@/app/imagemap/editor/geometry";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AvatarComponentCache } from "@/lib/avatar/render-cache";
import { cn } from "@/lib/utils";
import { Copy, FolderOpen, Square, Trash, X } from "lucide-react";
import type { DragEvent, MouseEvent, RefObject, TouchEvent } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTranslations } from "next-intl";

/**
 * The preview surface.
 *
 * Three nested elements, each with a distinct job:
 * - the scroller owns overflow and is what the ResizeObserver measures for "fit"
 * - the centring wrapper uses `m-auto` (not `justify-center`) so all four corners stay
 *   reachable once the scaled image overflows
 * - the stage is the event target and the keyboard focus target, and must stay a
 *   single element because `ContextMenuTrigger asChild` injects props into it
 */
export function PreviewStage({
  uploadedImage,
  imageSize,
  zoom,
  hasImage,
  rectangles,
  currentRect,
  selectedRect,
  currentTool,
  isTouchDevice,
  isPanning,
  isDraggingOver,
  rejectReason,
  handleSize,
  avatarCacheRef,
  avatarNaturalSizes,
  scrollRef,
  stageRef,
  imageRef,
  contextTargetId,
  onContextTargetChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onResizeStart,
  onAvatarMeasure,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDuplicate,
  onDelete,
  onStartCreate,
}: {
  uploadedImage: string | null;
  imageSize: { width: number; height: number };
  zoom: number;
  hasImage: boolean;
  rectangles: import("@/app/imagemap/types").Rectangle[];
  currentRect: import("@/app/imagemap/types").Rectangle | null;
  selectedRect: string | null;
  currentTool: string;
  isTouchDevice: boolean;
  isPanning: boolean;
  isDraggingOver: boolean;
  rejectReason: DnDRejectReason | undefined;
  handleSize: number;
  avatarCacheRef: RefObject<AvatarComponentCache>;
  avatarNaturalSizes: Record<string, { width: number; height: number }>;
  scrollRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  imageRef: RefObject<HTMLImageElement | null>;
  contextTargetId: string | null;
  onContextTargetChange: (id: string | null) => void;
  onPointerDown: (event: MouseEvent | TouchEvent) => void;
  onPointerMove: (event: MouseEvent | TouchEvent) => void;
  onPointerUp: () => void;
  onContextMenu: (event: MouseEvent) => void;
  onResizeStart: (
    event: MouseEvent | TouchEvent,
    id: string,
    handle: ResizeHandle,
  ) => void;
  onAvatarMeasure: (id: string, width: number, height: number) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStartCreate: () => void;
}) {
  const t = useTranslations("imagemap");
  const tc = useTranslations("common");

  if (!uploadedImage) {
    return (
      <div
        // No `w-full` here: combined with `m-3` it would resolve to 100% of the column
        // *plus* both margins, overflowing the column and sliding under the rail.
        // Flex stretch already subtracts the margins, so width is left unset.
        className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center m-3 rounded-lg border-2 border-dashed animate-simple hover:border-primary"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <FolderOpen className="w-12 h-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-muted-foreground">
              {t("placeholder.noImage.title")}
            </EmptyTitle>
            <EmptyDescription className="text-muted-foreground">
              {t("placeholder.noImage.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>

        {/* 拖放状态显示 */}
        {isDraggingOver && (
          <DragAndDropOverlay isRounded rejectReason={rejectReason} />
        )}
      </div>
    );
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) onContextTargetChange(null);
      }}
    >
      <ContextMenuTrigger asChild>
        <div
          ref={scrollRef}
          className="relative min-h-0 w-full flex-1 overflow-auto overscroll-contain bg-muted/30 outline-none"
        >
          {/* m-auto 而非 justify-center：内容大于容器时四个角都能滚动到 */}
          <div className="flex min-h-full min-w-full">
            <div
              ref={stageRef}
              className={cn(
                "relative m-auto shrink-0 touch-none select-none",
                isPanning
                  ? "cursor-grabbing"
                  : currentTool.startsWith("create")
                    ? "cursor-crosshair"
                    : "cursor-grab",
              )}
              style={{
                width: hasImage ? imageSize.width * zoom : undefined,
                height: hasImage ? imageSize.height * zoom : undefined,
              }}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={isPanning ? undefined : onPointerUp}
              onAuxClick={(event) => {
                // Safari 的中键自动滚动发生在 auxclick 阶段
                if (event.button === 1) event.preventDefault();
              }}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
              onContextMenu={onContextMenu}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              tabIndex={0}
            >
              {/* 显式像素尺寸，不使用 object-contain：
                  信箱留白会让 getBoundingClientRect() 与实际绘制区域错位 */}
              <img
                ref={imageRef}
                src={uploadedImage}
                alt=""
                aria-hidden
                draggable={false}
                className="block h-full w-full select-none"
              />

              {isDraggingOver && (
                <DragAndDropOverlay rejectReason={rejectReason} />
              )}

              {rectangles.map((rect, index) => (
                <RegionOverlay
                  key={rect.id}
                  rect={rect}
                  // 数组末尾在底层，因此索引 0 是最顶层，与命中测试顺序一致
                  zIndex={rectangles.length - index}
                  zoom={zoom}
                  selected={selectedRect === rect.id}
                  currentTool={currentTool}
                  isTouchDevice={isTouchDevice}
                  handleSize={handleSize}
                  avatarCacheRef={avatarCacheRef}
                  measured={avatarNaturalSizes[rect.id]}
                  onMeasure={onAvatarMeasure}
                  onResizeStart={onResizeStart}
                />
              ))}

              {currentRect && (
                <RegionOverlay
                  rect={currentRect}
                  draft
                  zoom={zoom}
                  zIndex={9999}
                  selected={false}
                  currentTool={currentTool}
                  isTouchDevice={isTouchDevice}
                  handleSize={handleSize}
                  avatarCacheRef={avatarCacheRef}
                  onMeasure={onAvatarMeasure}
                  onResizeStart={onResizeStart}
                />
              )}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {contextTargetId ? (
          <>
            <ContextMenuItem onSelect={() => onDuplicate(contextTargetId)}>
              <Copy className="w-4 h-4 mr-2" /> {tc("duplicate")}
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive"
              onSelect={() => onDelete(contextTargetId)}
            >
              <Trash className="w-4 h-4 mr-2" /> {tc("delete")}
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onSelect={onStartCreate}>
              <Square className="w-4 h-4 mr-2" /> {t("tools.create")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <X className="w-4 h-4 mr-2" /> {tc("cancel")}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
