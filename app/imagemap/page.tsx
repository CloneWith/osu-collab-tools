"use client";

import { canRenderAvatar, generateCompositeImage, getAvatarDataURL } from "@/app/imagemap/avatar-render";
import { AreaSettingsCard } from "@/app/imagemap/editor/cards/area-settings-card";
import { AreasListCard } from "@/app/imagemap/editor/cards/areas-list-card";
import { CodeCard } from "@/app/imagemap/editor/cards/code-card";
import { ImagePropsCard } from "@/app/imagemap/editor/cards/image-props-card";
import { IoCard } from "@/app/imagemap/editor/cards/io-card";
import { EditorShell } from "@/app/imagemap/editor/editor-shell";
import { calculateResizedRect, findRectAt, MIN_RECT_SIZE, normalizeRotation } from "@/app/imagemap/editor/geometry";
import { PreviewStage } from "@/app/imagemap/editor/preview-stage";
import {
  DEFAULT_OPEN_CARDS,
  type SidebarCardDef,
  type SidebarCardId,
  SIDEBAR_CARDS,
} from "@/app/imagemap/editor/sidebar-cards";
import { Toolbar } from "@/app/imagemap/editor/toolbar";
import { useViewportZoom } from "@/app/imagemap/editor/use-viewport-zoom";
import { SavePanelContent } from "@/components/imagemap/save-dialog";
import { DnDRejectReason } from "@/app/imagemap/dnd-overlay";
import { type ImageMapConfig, type Rectangle, RectangleType } from "@/app/imagemap/types";
import { HelpIconButton } from "@/components/help-icon-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { AvatarComponentCache } from "@/lib/avatar/render-cache";
import { AVATAR_STYLE_REGISTRY } from "@/lib/avatar/style-registry";
import { registerBBCodeHighlight } from "@/lib/hljs-support";
import { clamp, generateId, generateImageMapBBCode, generateImageMapHtml } from "@/lib/utils";
import { fileTypeFromBlob } from "file-type";
import hljs from "highlight.js/lib/core";
import html from "highlight.js/lib/languages/xml";
import { CircleUserRound, MousePointer, OctagonAlert, Square, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import type { ReactElement } from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Avatar } from "../avatar/types";

// 大小调整的八个点
type ResizeHandle = "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

type EditorTool = "select" | "create" | "create-avatar" | "delete";

interface Tool {
  key: EditorTool;
  name: string;
  icon: ReactElement;
}

// 工具栏中可用工具
const tools: Tool[] = [
  { key: "select", name: "select", icon: <MousePointer className="w-5 h-5" /> },
  { key: "create", name: "create", icon: <Square className="w-5 h-5" /> },
  {
    key: "create-avatar",
    name: "createAvatar",
    icon: <CircleUserRound className="w-5 h-5" />,
  },
  { key: "delete", name: "delete", icon: <Trash2 className="w-5 h-5" /> },
];

let hljsInitialized = false;
const ensureHljsInitialized = () => {
  if (hljsInitialized) return;
  hljs.registerLanguage("html", html);
  registerBBCodeHighlight();
  hljsInitialized = true;
};

ensureHljsInitialized();

export default function ImagemapEditorPage() {
  const t = useTranslations("imagemap");
  const tc = useTranslations("common");

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | undefined>(undefined);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Custom image properties
  const [imagePath, setImagePath] = useState<string | undefined>(undefined);
  const [mapName, setMapName] = useState<string | undefined>(undefined);

  // Rectangle and drawing states
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [selectedRect, setSelectedRectId] = useState<string | null>(null);
  const [movingRect, setMovingRect] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [resizingRect, setResizingRect] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState({ x: 0, y: 0 });
  const [resizeStartRect, setResizeStartRect] = useState<Rectangle | null>(null);
  const [draggingRectId, setDraggingRectId] = useState<string | null>(null);
  const [lastPositionInput, setLastPositionInput] = useState({
    x: "0",
    y: "0",
  });
  const [lastSizeInput, setLastSizeInput] = useState({
    width: "50",
    height: "50",
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // UI states
  const [contextTargetId, setContextTargetId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<EditorTool>("select");
  const [userInfo, setUserInfo] = useState<string>("");

  // Drag & drop states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rejectReason, setRejectReason] = useState<DnDRejectReason | undefined>(DnDRejectReason.Unknown);

  // Overwrite dialog state
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Sidebar state. There is no separate open flag: the card column is shown exactly
  // when at least one card is open, so no expand/collapse button is needed.
  const [openCards, setOpenCards] = useState<ReadonlySet<SidebarCardId>>(DEFAULT_OPEN_CARDS);

  // 中键平移状态
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);

  const { toast } = useToast();

  const imageRef = useRef<HTMLImageElement>(null);
  const rectListRef = useRef<HTMLDivElement>(null);
  const rectanglesRef = useRef<Rectangle[]>([]);
  const selectedRectRef = useRef<string | null>(null);
  const avatarCacheRef = useRef<AvatarComponentCache>(new Map());
  const [avatarNaturalSizes, setAvatarNaturalSizes] = useState<Record<string, { width: number; height: number }>>({});

  const handleSize = isTouchDevice ? 16 : 10;

  /**
   * 缩放由 zoom 单一状态源驱动，区域覆盖层与坐标换算都从它派生，
   * 不再读取渲染后的图片尺寸（那会形成布局与状态的反馈回路）。
   */
  const zoomApi = useViewportZoom({
    natural: imageSize,
    interactionActive: isDrawing || Boolean(movingRect) || Boolean(resizingRect) || isPanning,
  });
  const zoom = zoomApi.zoom;
  const hasImage = zoomApi.hasImage;
  const { scrollRef, stageRef } = zoomApi;
  const imageScale = useMemo(() => ({ scaleX: 1 / zoom, scaleY: 1 / zoom }), [zoom]);

  useEffect(() => {
    rectanglesRef.current = rectangles;
  }, [rectangles]);

  useEffect(() => {
    selectedRectRef.current = selectedRect;
  }, [selectedRect]);

  // 中键拖拽平移。move / up 挂在 window 上：指针移出舞台元素后 React 合成事件
  // 不再触发，绑在元素上会卡在 isPanning。
  useEffect(() => {
    if (!isPanning) return;

    const scroller = scrollRef.current;
    const origin = panRef.current;
    if (!scroller || !origin) return;

    const finish = () => {
      panRef.current = null;
      setIsPanning(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      // buttons 位掩码：4 = 中键。按钮已松开但没收到 mouseup 时兜底。
      if ((event.buttons & 4) === 0) {
        finish();
        return;
      }
      scroller.scrollLeft = origin.startScrollLeft - (event.clientX - origin.startClientX);
      scroller.scrollTop = origin.startScrollTop - (event.clientY - origin.startClientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", finish);
    window.addEventListener("blur", finish);
    document.addEventListener("mouseleave", finish);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("blur", finish);
      document.removeEventListener("mouseleave", finish);
    };
  }, [isPanning, scrollRef]);

  const handleImageUpload = (file: File | undefined) => {
    if (!file) return;
    // 已有图片时先确认覆盖，避免误操作丢失当前工作
    if (uploadedImage) {
      setPendingFile(file);
      setOverwriteDialogOpen(true);
      return;
    }

    void loadImageFile(file);
  };

  // Shared image loader for file input & drag-drop
  const loadImageFile = async (file: File) => {
    const detected = await fileTypeFromBlob(file);
    if (!detected?.mime?.startsWith("image/")) {
      toast({
        title: t("error.loadImage"),
        description: t("error.imageFormat"),
        variant: "destructive",
      });
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const source = e.target?.result as string;
      const img = document.createElement("img");
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;
        setImageSize({ width: naturalWidth, height: naturalHeight });
      };
      img.src = source;
      setUploadedImage(source);
      setRectangles([]);
      setSelectedRect(null);
    };
    reader.readAsDataURL(file);
  };

  // 预览区坐标 => 原图像坐标
  // getBoundingClientRect() 返回视口坐标，与 event.clientX/Y 同处一个 CSS px 空间，
  // 因此滚动位置与居中偏移都会自动抵消，无需另行补偿。
  const getRelativeCoordinates = (event: React.MouseEvent) => {
    if (!imageRef.current || !stageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = imageScale;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const getTouchCoordinates = (event: React.TouchEvent) => {
    if (!imageRef.current || !stageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    const { scaleX, scaleY } = imageScale;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const setSelectedRect = (id: string | null) => {
    setSelectedRectId(id);

    // 刻意同步输入框字符串：多个调用点依赖这一副作用
    if (id === null) {
      setLastPositionInput({ x: "0", y: "0" });
      setLastSizeInput({ width: "50", height: "50" });
      return;
    }

    const target = rectangles.find((r) => r.id === id);

    if (target) {
      setLastPositionInput({ x: target.x.toString(), y: target.y.toString() });
      setLastSizeInput({
        width: target.width.toString(),
        height: target.height.toString(),
      });
    } else {
      console.warn(`Cannot find a rectangle with selected id ${id}. Got:`, rectangles);
    }
  };

  const selectedRectData = useMemo(
    () => (selectedRect ? (rectangles.find((r) => r.id === selectedRect) ?? null) : null),
    [selectedRect, rectangles],
  );

  // 选中区域时自动展开区域设置卡片，但不强制展开侧栏本体：
  // 用户主动收起侧栏后被突然弹出会很惊悚。
  useEffect(() => {
    if (selectedRect === null) return;
    setOpenCards((prev) => (prev.has("area") ? prev : new Set(prev).add("area")));
  }, [selectedRect]);

  const positionBounds = selectedRectData
    ? {
        maxX: Math.max(0, imageSize.width - selectedRectData.width),
        maxY: Math.max(0, imageSize.height - selectedRectData.height),
      }
    : { maxX: imageSize.width, maxY: imageSize.height };

  const sizeBounds = selectedRectData
    ? {
        maxWidth: Math.max(MIN_RECT_SIZE, imageSize.width - selectedRectData.x),
        maxHeight: Math.max(MIN_RECT_SIZE, imageSize.height - selectedRectData.y),
      }
    : { maxWidth: imageSize.width, maxHeight: imageSize.height };

  const clampPositionInput = (field: "x" | "y", value: string) => {
    if (!selectedRectData || value.trim() === "") return null;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return null;

    const max = field === "x" ? positionBounds.maxX : positionBounds.maxY;
    return clamp(Math.round(numeric), 0, max);
  };

  const clampSizeInput = (field: "width" | "height", value: string) => {
    if (!selectedRectData || value.trim() === "") return null;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return null;

    const max = field === "width" ? sizeBounds.maxWidth : sizeBounds.maxHeight;
    return clamp(Math.round(numeric), MIN_RECT_SIZE, max);
  };

  // 使用键盘移动区域与切换模式
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;

      // 区域设置卡片可能被关闭，此时区域列表容器并未挂载，用「是否在容器内」
      // 判断会让快捷键整体失效。改为排除文本录入控件即可。
      const tagName = active?.tagName;
      const isTextEntry =
        tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || active?.isContentEditable === true;
      if (isTextEntry) return;

      // 模式切换
      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < tools.length) {
          setCurrentTool(tools[index].key);
          event.preventDefault();
        }
        return;
      }

      if (!selectedRectRef.current) return;

      const selectedId = selectedRectRef.current;

      // 创建副本
      if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === "d") {
        setRectangles((prev) => {
          const rectToDuplicate = prev.find((rect) => rect.id === selectedId);
          if (!rectToDuplicate) return prev;

          const newRect: Rectangle = {
            ...rectToDuplicate,
            id: generateId(),
            x: rectToDuplicate.x + 20,
            y: rectToDuplicate.y + 20,
            alt: `${rectToDuplicate.alt} ${tc("duplicateSuffix")}`,
          };

          setSelectedRect(newRect.id);
          return [newRect, ...prev];
        });
        event.preventDefault();
        return;
      }

      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        // 层级调节
        if (event.key === "-" || event.key === "=") {
          setRectangles((prev) => {
            const next = [...prev];
            const fromIndex = next.findIndex((rect) => rect.id === selectedId);
            if (fromIndex === -1) return prev;

            const toIndex = fromIndex + (event.key === "-" ? 1 : -1);
            if (toIndex < 0 || toIndex >= next.length) return prev;

            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
          });
          event.preventDefault();
          return;
        }
      }

      // 删除
      if (event.key === "Delete") {
        setRectangles((prev) => prev.filter((rect) => rect.id !== selectedId));
        setSelectedRect(null);
        avatarCacheRef.current.delete(selectedId);
        setAvatarNaturalSizes((prev) => {
          const { [selectedId]: _omit, ...rest } = prev;
          return rest;
        });
        event.preventDefault();
        return;
      }

      // Shift - 精细调节，Ctrl - 快速调节
      const step = event.shiftKey ? 1 : event.ctrlKey ? 20 : 10;
      let dx = 0;
      let dy = 0;

      switch (event.key) {
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        default:
          return;
      }

      const target = rectanglesRef.current.find((r) => r.id === selectedId);
      if (!target) return;

      const newX = clamp(target.x + dx, 0, Math.max(0, imageSize.width - target.width));
      const newY = clamp(target.y + dy, 0, Math.max(0, imageSize.height - target.height));

      if (newX === target.x && newY === target.y) {
        event.preventDefault();
        return;
      }

      setRectangles((prev) => prev.map((r) => (r.id === selectedId ? { ...r, x: newX, y: newY } : r)));

      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Update input fields after arrow key release
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (selectedRectData && selectedRectRef.current === selectedRectData.id) {
          setLastPositionInput({
            x: selectedRectData.x.toString(),
            y: selectedRectData.y.toString(),
          });
        }
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [imageSize.height, imageSize.width, selectedRectData, tc]);

  // 几何计算已抽到 geometry.ts，纯函数且有单测覆盖
  const resizeRect = (rect: Rectangle, handle: ResizeHandle, deltaX: number, deltaY: number) => {
    const styleObj = AVATAR_STYLE_REGISTRY.find((s) => s.key === (rect.avatar?.styleKey ?? "simple"))?.style;
    const measured = avatarNaturalSizes[rect.id];
    return calculateResizedRect(rect, handle, { x: deltaX, y: deltaY }, imageSize, {
      width: measured?.width ?? styleObj?.size.width ?? 0,
      height: measured?.height ?? styleObj?.size.height ?? 0,
    });
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    const coords = getRelativeCoordinates(event);
    const clickedRect = findRectAt(coords, rectangles);

    setContextTargetId(clickedRect?.id ?? null);

    if (clickedRect) {
      setSelectedRect(clickedRect.id);
    }
  };

  // 复制区域
  const duplicateRectangle = (id: string) => {
    const rectToDuplicate = rectangles.find((rect) => rect.id === id);
    if (rectToDuplicate) {
      const newRect: Rectangle = {
        ...rectToDuplicate,
        id: generateId(),
        x: rectToDuplicate.x + 20,
        y: rectToDuplicate.y + 20,
        alt: `${rectToDuplicate.alt} ${tc("duplicateSuffix")}`,
      };
      setRectangles((prev) => [newRect, ...prev]);
      setSelectedRect(newRect.id);
    }
  };

  const handleResizeStart = (event: React.MouseEvent | React.TouchEvent, rectId: string, handle: ResizeHandle) => {
    if (!uploadedImage || currentTool !== "select") return;

    event.stopPropagation();
    if ("preventDefault" in event) {
      event.preventDefault();
    }

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);
    const targetRect = rectangles.find((r) => r.id === rectId);
    if (!targetRect) return;

    setSelectedRect(rectId);
    setResizingRect(rectId);
    setResizeHandle(handle);
    setResizeStartPoint(coords);
    setResizeStartRect(targetRect);
  };

  const startPan = (event: React.MouseEvent) => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    // 阻止 Chrome / Firefox 的中键自动滚动
    event.preventDefault();
    panRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: scroller.scrollLeft,
      startScrollTop: scroller.scrollTop,
    };
    setIsPanning(true);
  };

  const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;

    if ("button" in event) {
      const button = (event as React.MouseEvent).button;
      // 忽略鼠标右键，避免与上下文菜单交叉交互
      if (button === 2) return;
      // 中键拖拽平移。在工具分支之前直接返回，因此结构上不可能
      // 启动绘制 / 移动 / 缩放，也不需要额外的 if 判断。
      if (button === 1) {
        startPan(event as React.MouseEvent);
        return;
      }
    }

    // 检测是否为触摸设备
    if ("touches" in event) {
      setIsTouchDevice(true);
    }

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    // 检查是否点击在矩形上
    const clickedRect = findRectAt(coords, rectangles);

    // 根据当前工具执行不同操作
    switch (currentTool) {
      case "select":
        if (clickedRect) {
          setMovingRect(clickedRect.id);
          setMoveOffset({
            x: coords.x - clickedRect.x,
            y: coords.y - clickedRect.y,
          });
          setSelectedRect(clickedRect.id);
        } else {
          setSelectedRect(null);
        }
        break;

      case "create":
      case "create-avatar":
        setSelectedRect(null);

        if (coords.x <= imageSize.width && coords.y <= imageSize.height) {
          setIsDrawing(true);
          setStartPoint({ x: Math.round(coords.x), y: Math.round(coords.y) });
        }
        break;

      case "delete":
        if (clickedRect) {
          deleteRectangle(clickedRect.id);
        }
        break;
    }

    // 防止触摸时的默认行为（如滚动）
    if ("touches" in event) {
      event.preventDefault();
    }
  };

  const handleAvatarMeasure = (id: string, width: number, height: number) => {
    setAvatarNaturalSizes((prev) => {
      const current = prev[id];
      if (current && current.width === width && current.height === height) return prev;
      return { ...prev, [id]: { width, height } };
    });
  };

  const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;
    // 平移期间不参与任何编辑手势，即使后续调整了 pointerdown 的分支顺序也不会误触发
    if (panRef.current) return;

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    if (resizingRect && resizeHandle && resizeStartRect) {
      const deltaX = coords.x - resizeStartPoint.x;
      const deltaY = coords.y - resizeStartPoint.y;

      const resized = resizeRect(resizeStartRect, resizeHandle, deltaX, deltaY);

      setRectangles((prev) =>
        prev.map((rect) =>
          rect.id === resizingRect
            ? {
                ...rect,
                x: resized.x,
                y: resized.y,
                width: resized.width,
                height: resized.height,
              }
            : rect,
        ),
      );

      // Don't update input fields during drag - only update when drag ends in handlePointerUp

      if ("touches" in event) {
        event.preventDefault();
      }
      return;
    }

    // 根据当前工具执行不同操作
    if (isDrawing && (currentTool === "create" || currentTool === "create-avatar")) {
      // 创建新矩形
      const width = Math.round(coords.x - startPoint.x);
      const height = Math.round(coords.y - startPoint.y);

      const rect: Rectangle = {
        id: "temp",
        type: currentTool === "create-avatar" ? RectangleType.Avatar : RectangleType.MapArea,
        x: Math.round(Math.min(startPoint.x, coords.x)),
        y: Math.round(Math.min(startPoint.y, coords.y)),
        width: Math.abs(width),
        height: Math.abs(height),
        href: "",
        alt: "",
      };

      setCurrentRect(rect);
    } else if (movingRect && currentTool === "select") {
      // 移动现有矩形
      setRectangles((prev) =>
        prev.map((rect) => {
          if (rect.id === movingRect) {
            return {
              ...rect,
              x: Math.round(clamp(coords.x - moveOffset.x, 0, imageSize.width - rect.width)),
              y: Math.round(clamp(coords.y - moveOffset.y, 0, imageSize.height - rect.height)),
            };
          }
          return rect;
        }),
      );
    }

    // 防止触摸时的默认行为
    if ("touches" in event) {
      event.preventDefault();
    }
  };

  const handlePointerUp = () => {
    // 处理绘制结束
    if (isDrawing && (currentTool === "create" || currentTool === "create-avatar")) {
      if (!currentRect || currentRect.width < MIN_RECT_SIZE || currentRect.height < MIN_RECT_SIZE) {
        setIsDrawing(false);
        setCurrentRect(null);
        return;
      }

      const newRect: Rectangle = {
        ...currentRect,
        id: generateId(),
        width: Math.round(Math.min(currentRect.width, imageSize.width - currentRect.x)),
        height: Math.round(Math.min(currentRect.height, imageSize.height - currentRect.y)),
      };

      // 初始化 Avatar 区域的默认配置
      if (newRect.type === RectangleType.Avatar) {
        newRect.avatar = {
          styleKey: "simple",
          imageUrl: "",
          username: "",
          countryCode: "",
        };

        // 绘制结束后按样式的宽高比调整为等比（contain）大小，锚定左上角。
        // 此处不能查 avatarNaturalSizes：id 刚由 generateId() 生成，该键从未被写入过，
        // 真正的等比调整会在首次 onMeasure 之后由 resizeRect 接手。
        const styleObj = AVATAR_STYLE_REGISTRY.find((s) => s.key === "simple")?.style;
        const naturalW = styleObj?.size.width ?? newRect.width;
        const naturalH = styleObj?.size.height ?? newRect.height;
        const scale = Math.min(
          naturalW > 0 ? newRect.width / naturalW : 1,
          naturalH > 0 ? newRect.height / naturalH : 1,
        );
        let lockedW = Math.round(naturalW * scale);
        let lockedH = Math.round(naturalH * scale);
        // 边界限制
        lockedW = clamp(lockedW, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.width - newRect.x));
        lockedH = clamp(lockedH, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.height - newRect.y));
        newRect.width = lockedW;
        newRect.height = lockedH;
      }

      setRectangles((prev) => [newRect, ...prev]);

      setSelectedRectId(newRect.id);
      setLastPositionInput({
        x: newRect.x.toString(),
        y: newRect.y.toString(),
      });
      setLastSizeInput({
        width: newRect.width.toString(),
        height: newRect.height.toString(),
      });

      setIsDrawing(false);
      setCurrentRect(null);
    }

    // 处理移动结束
    if (movingRect) {
      setMovingRect(null);
      // Update input fields after movement is complete
      const movedRect = rectangles.find((r) => r.id === movingRect);
      if (movedRect && selectedRect === movingRect) {
        setLastPositionInput({
          x: movedRect.x.toString(),
          y: movedRect.y.toString(),
        });
      }
    }

    // 处理缩放结束 - 更新输入字段
    if (resizingRect) {
      setResizingRect(null);
      setResizeHandle(null);
      setResizeStartRect(null);
      // Update input fields after resize completes
      if (selectedRectData) {
        setLastPositionInput({
          x: selectedRectData.x.toString(),
          y: selectedRectData.y.toString(),
        });
        setLastSizeInput({
          width: selectedRectData.width.toString(),
          height: selectedRectData.height.toString(),
        });
      }
    }
  };

  const updateRectangle = (id: string, field: keyof Rectangle, value: string, castToNumber: boolean = false) => {
    // Don't update if user needs a number, and we cannot convert the source value to one.
    if (castToNumber && Number.isNaN(Number(value))) return;

    setRectangles((prev) =>
      prev.map((rect) => (rect.id === id ? { ...rect, [field]: castToNumber ? Number(value) : value } : rect)),
    );
  };

  const updateRotation = (id: string, degrees: number) => {
    const normalized = normalizeRotation(degrees);
    setRectangles((prev) =>
      prev.map((rect) => {
        if (rect.id !== id) return rect;
        // Store undefined rather than 0 so exported JSON stays free of rotation noise.
        if (normalized === 0) {
          const { rotation: _omit, ...rest } = rect;
          return rest;
        }
        return { ...rect, rotation: normalized };
      }),
    );
  };

  const updateRectangleType = (id: string, nextType: RectangleType) => {
    setRectangles((prev) =>
      prev.map((rect) => {
        if (rect.id !== id) return rect;
        const base: Rectangle = { ...rect, type: nextType };
        if (nextType === RectangleType.Avatar) {
          return {
            ...base,
            avatar: base.avatar ?? {
              styleKey: "simple",
              imageUrl: "",
              username: "",
              countryCode: "",
            },
          };
        }
        const { avatar, rotation, ...rest } = base;
        // 清理缓存，避免残留的头像组件
        avatarCacheRef.current.delete(id);
        // 清理测量尺寸缓存
        setAvatarNaturalSizes((prev) => {
          const { [id]: _omit, ...restSizes } = prev;
          return restSizes;
        });
        return rest as Rectangle;
      }),
    );
  };

  const updateAvatarField = (id: string, field: keyof Avatar, value: string) => {
    setRectangles((prev) =>
      prev.map((rect) => {
        if (rect.id !== id) return rect;
        if (rect.type !== RectangleType.Avatar) return rect;
        const avatar = rect.avatar ?? {
          styleKey: "simple",
          imageUrl: "",
          username: "",
          countryCode: "",
        };
        return { ...rect, avatar: { ...avatar, [field]: value } };
      }),
    );
  };

  const deleteRectangle = (id: string) => {
    setRectangles((prev) => prev.filter((rect) => rect.id !== id));
    if (selectedRect === id) {
      setSelectedRect(null);
    }
    // 清理按 id 索引的所有缓存
    avatarCacheRef.current.delete(id);
    setAvatarNaturalSizes((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const handlePositionInput = (field: "x" | "y", value: string) => {
    if (!selectedRect) return;
    const clamped = clampPositionInput(field, value);
    if (clamped === null) return;

    setLastPositionInput({ ...lastPositionInput, [field]: clamped.toString() });
    updateRectangle(selectedRect, field, clamped.toString(), true);
  };

  const handleSizeInput = (field: "width" | "height", value: string) => {
    if (!selectedRect) return;
    const clamped = clampSizeInput(field, value);
    if (clamped === null) return;

    setLastSizeInput({ ...lastSizeInput, [field]: clamped.toString() });
    updateRectangle(selectedRect, field, clamped.toString(), true);
  };

  const toggleCard = (id: SidebarCardId) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCardStates = Object.fromEntries(SIDEBAR_CARDS.map((def) => [def.id, openCards.has(def.id)])) as Record<
    SidebarCardId,
    boolean
  >;

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const dt = event.dataTransfer;
    let imageCount = 0;

    // File type detection by items, files as a fallback
    if (dt?.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const it = dt.items[i];
        if (it.kind === "file") {
          const type = it.type || "";
          if (type.startsWith("image/")) imageCount++;
        }
      }
    } else if (dt?.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i];
        if ((f.type || "").startsWith("image/")) imageCount++;
      }
    }

    if (imageCount > 1) {
      setRejectReason(DnDRejectReason.TooManyEntries);
    } else if (imageCount === 1) {
      setRejectReason(undefined);
    } else {
      setRejectReason(DnDRejectReason.UnsupportedType);
    }

    setIsDraggingOver(true);
    if (dt) dt.dropEffect = imageCount === 1 ? "copy" : "none";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    // Pick the first image file
    let file: File | null = null;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type?.startsWith("image/")) {
        file = f;
        break;
      }
    }

    handleImageUpload(file ?? undefined);
  };

  const reorderRectangles = (sourceId: string, targetId: string) => {
    setRectangles((prev) => {
      const fromIndex = prev.findIndex((r) => r.id === sourceId);
      const toIndex = prev.findIndex((r) => r.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStartRow = (event: React.DragEvent, id: string) => {
    setDraggingRectId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragEndRow = () => {
    setDraggingRectId(null);
  };

  const handleDragOverRow = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggingRectId && draggingRectId !== id) {
      reorderRectangles(draggingRectId, id);
    }
  };

  const handleDropOnRow = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingRectId && draggingRectId !== id) {
      reorderRectangles(draggingRectId, id);
    }
    setDraggingRectId(null);
  };

  const touchDragRef = useRef<{ id: string; startY: number } | null>(null);

  const handleTouchStartRow = (id: string) => {
    touchDragRef.current = { id, startY: 0 };
    setDraggingRectId(id);
  };

  const handleTouchMoveRow = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch || !touchDragRef.current) return;

    const list = rectListRef.current;
    if (!list) return;

    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-rect-id]");

    const targetId = target?.dataset.rectId;
    if (targetId && targetId !== touchDragRef.current.id) {
      reorderRectangles(touchDragRef.current.id, targetId);
    }
  };

  const handleTouchEndRow = () => {
    touchDragRef.current = null;
    setDraggingRectId(null);
  };

  const handleImportData = (data: ImageMapConfig) => {
    avatarCacheRef.current.clear();
    setAvatarNaturalSizes({});
    if (data.imagePath) setImagePath(data.imagePath);
    if (data.imageName) setImageName(data.imageName);
    if (data.mapName) setMapName(data.mapName);
    setSelectedRect(null);
    setRectangles(data.rectangles);
  };

  // 导出高质量图像，使用与预览区相同的渲染逻辑
  const handleExportImage = async (options: { format: string; quality: number }): Promise<string> => {
    if (!uploadedImage) throw new Error(t("error.generateFailed"));

    try {
      // 不再传入预览缩放：头像按原始像素渲染，导出分辨率与预览缩放彻底解耦。
      // computeUniformScale 只取 min(dw/nw, dh/nh)，同倍放大时留白比例不变。
      const avatarPromises = rectangles.filter(canRenderAvatar).map(async (rect) => {
        const avatarDataURL = await getAvatarDataURL(
          rect,
          AVATAR_STYLE_REGISTRY,
          avatarCacheRef,
          avatarNaturalSizes[rect.id],
          // Keep previous measured sizes as the preview uses them
          () => {},
        );
        return {
          data: avatarDataURL,
          attrs: rect,
        };
      });

      const avatarsWithData = await Promise.all(avatarPromises);
      const validAvatars = avatarsWithData.filter(
        (item): item is { data: string; attrs: Rectangle } => typeof item.data === "string" && item.data.length > 0,
      );

      const compositeDataURL = await generateCompositeImage(
        uploadedImage,
        validAvatars,
        options.format,
        options.quality,
      );

      if (compositeDataURL) return compositeDataURL;
      throw new Error(t("error.generateFailed"));
    } finally {
      setAvatarNaturalSizes((prev) => ({ ...prev }));
    }
  };

  const deferredRectangles = useDeferredValue(rectangles);
  const resolvedImagePath = imagePath ?? imageName;
  const exportData = useMemo(
    () => ({ imagePath, imageName, mapName, rectangles }),
    [imageName, imagePath, mapName, rectangles],
  );

  // Cached generated code
  const htmlCode = useMemo(
    () => generateImageMapHtml(deferredRectangles, resolvedImagePath, mapName),
    [deferredRectangles, mapName, resolvedImagePath],
  );
  const bbCode = useMemo(
    () => generateImageMapBBCode(deferredRectangles, imageSize.width, imageSize.height, resolvedImagePath),
    [deferredRectangles, imageSize.height, imageSize.width, resolvedImagePath],
  );

  const highlightedHtmlCode = useMemo(() => hljs.highlight(htmlCode, { language: "html" }).value, [htmlCode]);
  const highlightedBBCode = useMemo(() => hljs.highlight(bbCode, { language: "bbcode" }).value, [bbCode]);

  const renderSidebarCard = (def: SidebarCardDef) => {
    switch (def.id) {
      case "image":
        return (
          <ImagePropsCard
            imagePath={imagePath}
            mapName={mapName}
            onImagePathChange={setImagePath}
            onMapNameChange={setMapName}
          />
        );
      case "areas":
        return (
          <AreasListCard
            rectangles={rectangles}
            selectedRect={selectedRect}
            draggingRectId={draggingRectId}
            listRef={rectListRef}
            onSelect={setSelectedRect}
            onDuplicate={duplicateRectangle}
            onDelete={deleteRectangle}
            onDragStartRow={handleDragStartRow}
            onDragEndRow={handleDragEndRow}
            onDragOverRow={handleDragOverRow}
            onDropOnRow={handleDropOnRow}
            onTouchStartRow={handleTouchStartRow}
            onTouchMoveRow={handleTouchMoveRow}
            onTouchEndRow={handleTouchEndRow}
          />
        );
      case "area":
        // 无选中区域时该卡片不展示内容（外层已因 selectedRect 为空而关闭）
        return selectedRectData ? (
          <AreaSettingsCard
            rect={selectedRectData}
            positionBounds={positionBounds}
            sizeBounds={sizeBounds}
            lastPositionInput={lastPositionInput}
            lastSizeInput={lastSizeInput}
            userInfo={userInfo}
            onDuplicate={duplicateRectangle}
            onDelete={deleteRectangle}
            onChangeField={updateRectangle}
            onChangeType={updateRectangleType}
            onChangeAvatarField={updateAvatarField}
            onChangeRotation={updateRotation}
            onPositionInput={handlePositionInput}
            onSizeInput={handleSizeInput}
            onUserInfoChange={setUserInfo}
          />
        ) : null;
      case "code":
        return (
          <CodeCard
            hasImage={Boolean(uploadedImage)}
            hasRegions={deferredRectangles.length > 0}
            htmlCode={htmlCode}
            bbCode={bbCode}
            highlightedHtml={highlightedHtmlCode}
            highlightedBBCode={highlightedBBCode}
          />
        );
      case "save":
        return uploadedImage ? (
          <SavePanelContent
            baseName={mapName?.trim() || imageName?.split(".")[0] || "imagemap"}
            onSave={handleExportImage}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("placeholder.noImage.description")}</p>
        );
      case "io":
        return (
          <IoCard
            exportData={exportData}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            canExport={Boolean(uploadedImage)}
            onImport={handleImportData}
          />
        );
      default:
        return null;
    }
  };

  const preview = (
    <PreviewStage
      uploadedImage={uploadedImage}
      imageSize={imageSize}
      zoom={zoom}
      hasImage={hasImage}
      rectangles={rectangles}
      currentRect={currentRect}
      selectedRect={selectedRect}
      currentTool={currentTool}
      isTouchDevice={isTouchDevice}
      isPanning={isPanning}
      isDraggingOver={isDraggingOver}
      rejectReason={rejectReason}
      handleSize={handleSize}
      avatarCacheRef={avatarCacheRef}
      avatarNaturalSizes={avatarNaturalSizes}
      scrollRef={scrollRef}
      stageRef={stageRef}
      imageRef={imageRef}
      contextTargetId={contextTargetId}
      onContextTargetChange={setContextTargetId}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onResizeStart={handleResizeStart}
      onAvatarMeasure={handleAvatarMeasure}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDuplicate={duplicateRectangle}
      onDelete={deleteRectangle}
      onStartCreate={() => setCurrentTool("create")}
    />
  );

  return (
    <TooltipProvider delayDuration={300}>
      {/* `100dvh` minus the navbar rather than a hard-coded height: the navbar is
          sticky (in flow) and carries a 1px bottom border, so it actually occupies
          65px. Deriving the height here keeps the page exactly one viewport tall and
          stops a 1px overflow from revealing a page scrollbar. */}
      <div className="h-[calc(100dvh-4.0625rem)] overflow-hidden bg-background">
        <EditorShell
          openCards={openCards}
          onToggleCard={toggleCard}
          hasImage={hasImage}
          topBar={
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
              <div className="min-w-0">
                <h1 className="flex-title text-lg font-bold text-foreground">
                  <span className="text-primary">{t("title")}</span>
                  <HelpIconButton section="imagemap" />
                </h1>
                <p className="truncate text-xs text-secondary-foreground">{t("description")}</p>
              </div>
            </div>
          }
          preview={preview}
          toolbar={
            <Toolbar
              tools={tools}
              currentTool={currentTool}
              onSelectTool={(tool) => setCurrentTool(tool as EditorTool)}
              onImageSelected={handleImageUpload}
              onToggleCard={toggleCard}
              openCardStates={openCardStates}
              zoom={zoomApi}
              hasImage={hasImage}
            />
          }
          renderCard={renderSidebarCard}
        />

        {/* 覆盖确认对话框 */}
        <AlertDialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex flex-row items-center gap-2">
                <OctagonAlert />
                {t("dialog.overwrite.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>{t("dialog.overwrite.description")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPendingFile(null);
                }}
              >
                {tc("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive/50 hover:bg-destructive"
                onClick={() => {
                  if (pendingFile) {
                    void loadImageFile(pendingFile);
                  }
                  setPendingFile(null);
                  setOverwriteDialogOpen(false);
                }}
              >
                {t("dialog.overwrite.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
