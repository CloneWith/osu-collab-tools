"use client";

import { AvatarBox, canRenderAvatar } from "@/app/imagemap/avatar-render";
import {
  normalizeRotation,
  resizeHandles,
  type ResizeHandle,
} from "@/app/imagemap/editor/geometry";
import type { Rectangle } from "@/app/imagemap/types";
import { AVATAR_STYLE_REGISTRY } from "@/lib/avatar/style-registry";
import type { AvatarComponentCache } from "@/lib/avatar/render-cache";
import { cn } from "@/lib/utils";
import type { MouseEvent, RefObject, TouchEvent } from "react";

/** Minimum touch target in CSS pixels, applied symmetrically about the region centre. */
const TOUCH_MIN_SIZE = 44;

export function RegionOverlay({
  rect,
  zIndex,
  zoom,
  selected,
  draft = false,
  currentTool,
  isTouchDevice,
  handleSize,
  avatarCacheRef,
  measured,
  onMeasure,
  onResizeStart,
}: {
  rect: Rectangle;
  zIndex: number;
  zoom: number;
  selected: boolean;
  /** The in-progress rectangle while dragging with a create tool. */
  draft?: boolean;
  currentTool: string;
  isTouchDevice: boolean;
  handleSize: number;
  avatarCacheRef: RefObject<AvatarComponentCache>;
  measured?: { width: number; height: number };
  onMeasure: (id: string, width: number, height: number) => void;
  onResizeStart: (
    event: MouseEvent | TouchEvent,
    id: string,
    handle: ResizeHandle,
  ) => void;
}) {
  const rotation = normalizeRotation(rect.rotation);
  const minSize = isTouchDevice ? TOUCH_MIN_SIZE : 0;
  const displayWidth = Math.max(rect.width * zoom, minSize);
  const displayHeight = Math.max(rect.height * zoom, minSize);

  const cursor =
    currentTool === "select"
      ? "move"
      : currentTool === "delete"
        ? "no-drop"
        : currentTool === "create" || currentTool === "create-avatar"
          ? "crosshair"
          : "pointer";

  if (draft) {
    return (
      <div
        className="absolute border-2 border-red-400 bg-red-500/10 select-none"
        style={{
          left: rect.x * zoom,
          top: rect.y * zoom,
          width: rect.width * zoom,
          height: rect.height * zoom,
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute border-2 bg-primary/20 select-none touch-manipulation transition-colors ease-out duration-200",
        selected ? "border-primary" : "border-primary/40",
        currentTool === "delete" && "hover:border-red-400",
        // 允许选中区域的八个点在边界外正常显示
        "overflow-visible box-border",
      )}
      style={{
        left: rect.x * zoom,
        top: rect.y * zoom,
        width: displayWidth,
        height: displayHeight,
        // 绕中心旋转：left/top 始终描述未旋转的轴对齐盒，位置计算无需补偿
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        cursor,
        zIndex,
      }}
    >
      {/* Avatar 区域渲染：在矩形中显示头像卡片 */}
      {canRenderAvatar(rect) && (
        <AvatarBox
          rect={rect}
          displayW={displayWidth}
          displayH={displayHeight}
          styleRegistry={AVATAR_STYLE_REGISTRY}
          cacheRef={avatarCacheRef}
          measured={measured}
          onMeasure={(width, height) => onMeasure(rect.id, width, height)}
        />
      )}

      {rect.alt.trim() && (
        <div
          className={cn(
            "absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1 rounded select-none max-w-full truncate",
            isTouchDevice && "text-sm px-2 py-1",
          )}
          // 反向抵消父级旋转，让标签始终水平
          style={{
            transform: rotation ? `rotate(${-rotation}deg)` : undefined,
            transformOrigin: "bottom left",
          }}
        >
          {rect.alt.trim()}
        </div>
      )}

      {selected &&
        currentTool === "select" &&
        // 头像区域只保留右下角手柄（宽高比锁定）
        resizeHandles(rect).map((item) => (
          <div
            key={item.handle}
            className="absolute bg-primary border border-white shadow-xs"
            style={{
              left: item.left,
              top: item.top,
              width: handleSize,
              height: handleSize,
              cursor: item.cursor,
              // 以锚点为中心，并抵消父级旋转使手柄保持正方形
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              // 确保在顶层显示（高于内部内容与边框）
              zIndex: 100,
            }}
            onMouseDown={(e) => onResizeStart(e, rect.id, item.handle)}
            onTouchStart={(e) => onResizeStart(e, rect.id, item.handle)}
          />
        ))}
    </div>
  );
}
