"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import {
  Code,
  Copy, Eye,
  Hash,
  GripVertical,
  MousePointer,
  MoreVertical,
  OctagonAlert, Settings,
  Square,
  Trash,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { clamp } from "@/lib/utils";
import DragAndDropOverlay, { DnDRejectReason } from "@/app/imagemap/dnd-overlay";
import { common } from "@/app/common";
import hljs from "highlight.js/lib/core";
import html from "highlight.js/lib/languages/xml";
import { HelpIconButton } from "@/components/help-icon-button";

interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  alt: string;
}

// 大小调整的八个点
type ResizeHandle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface ContextMenuPosition {
  x: number;
  y: number;
  visible: boolean;
  targetId: string | null;
}

type EditorTool = "select" | "create" | "delete"

const tool_names = {
  "select": "选择",
  "create": "创建",
  "delete": "删除",
};

/**
 * 向 Highlight.js 注册 BBCode 解析库。
 * @author Paul Reid (https://github.com/highlightjs/highlightjs-bbcode/blob/master/bbcode.js)
 */
function registerBBCodeHighlight() {
  hljs.registerLanguage("bbcode", function (_) {
    return {
      case_insensitive: true,
      contains: [
        {
          className: "name",
          begin: /\[[^=\s\]]*/,
        },
        {
          className: "name",
          begin: "]",
        },
        {
          className: "attribute",
          begin: /(?<==)[^\]\s]*/,
        },
        {
          className: "attr",
          begin: /(?<=\[[^\]]* )[^\s=\]]*/,
        },
        {
          className: "string",
          begin: /[=;:8]'?\-?[\)\(3SPDO>@$|/]/,
        },
        {
          className: "string",
          begin: /:[\w]*:/,
        },
      ],
    };
  });
}

export default function EditorPage() {
  // 在 SSR / 构建阶段没有 window / localStorage
  const server_link = typeof window !== "undefined"
    ? (localStorage.getItem("custom_endpoint") ?? common.defaultEndpoint)
    : common.defaultEndpoint;

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({width: 0, height: 0});

  // Custom image properties
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [mapName, setMapName] = useState<string | null>(null);

  // Rectangle and drawing states
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({x: 0, y: 0});
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [selectedRect, setSelectedRectId] = useState<string | null>(null);
  const [movingRect, setMovingRect] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({x: 0, y: 0});
  const [resizingRect, setResizingRect] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState({x: 0, y: 0});
  const [resizeStartRect, setResizeStartRect] = useState<Rectangle | null>(null);
  const [draggingRectId, setDraggingRectId] = useState<string | null>(null);
  const [lastPositionInput, setLastPositionInput] = useState({x: "0", y: "0"});
  const [lastSizeInput, setLastSizeInput] = useState({width: "50", height: "50"});

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [windowResizeCounter, setWindowResizeCounter] = useState(0);

  // UI states
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>({
    x: 0,
    y: 0,
    visible: false,
    targetId: null,
  });
  const [currentTool, setCurrentTool] = useState<EditorTool>("select");
  const [userInfo, setUserInfo] = useState<string>("");
  // Drag & drop states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragAccept, setIsDragAccept] = useState(false);
  const [rejectReason, setRejectReason] = useState<DnDRejectReason>(DnDRejectReason.Unknown);
  const [dragDepth, setDragDepth] = useState(0);

  // Overwrite dialog state
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const {toast} = useToast();

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const rectListRef = useRef<HTMLDivElement>(null);
  const rectanglesRef = useRef<Rectangle[]>([]);
  const selectedRectRef = useRef<string | null>(null);

  // 注册 hljs 语言
  hljs.registerLanguage("html", html);
  registerBBCodeHighlight();

  useEffect(() => {
    rectanglesRef.current = rectangles;
  }, [rectangles]);

  useEffect(() => {
    selectedRectRef.current = selectedRect;
  }, [selectedRect]);

  // 关闭右键菜单的事件处理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({...prev, visible: false}));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 监听容器大小变化，重新计算图像显示位置和大小
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // 触发重新渲染以更新区域位置和大小
      setWindowResizeCounter((prev) => prev + 1);
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 监听图像元素尺寸变化与浏览器缩放（visualViewport），以在缩放时正确刷新坐标映射
  useEffect(() => {
    const imgEl = imageRef.current;

    // 当图片渲染尺寸变化（例如 zoom 导致布局变化）时，触发刷新
    const imgObserver = new ResizeObserver(() => {
      setWindowResizeCounter((prev) => prev + 1);
    });
    if (imgEl) {
      imgObserver.observe(imgEl);
    }

    // 部分浏览器支持 visualViewport，可用于捕获缩放事件
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const handleVVResize = () => setWindowResizeCounter((prev) => prev + 1);
    if (vv) {
      vv.addEventListener("resize", handleVVResize);
      vv.addEventListener("scroll", handleVVResize); // 移动端缩放下视口偏移也会影响坐标
    } else {
      // 使用 window resize（多数浏览器缩放时也会触发）
      const handleWindowResize = () => setWindowResizeCounter((prev) => prev + 1);
      window.addEventListener("resize", handleWindowResize);
      // 清理时移除该监听
      return () => {
        imgObserver.disconnect();
        window.removeEventListener("resize", handleWindowResize);
      };
    }

    return () => {
      imgObserver.disconnect();
      if (vv) {
        vv.removeEventListener("resize", handleVVResize);
        vv.removeEventListener("scroll", handleVVResize);
      }
    };
  }, [uploadedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      loadImageFile(file);
    }
  };

  // Shared image loader for file input & drag-drop
  const loadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "文件类型不支持",
        description: "请拖入或选择图片" +
          "文件（如 .png / .jpg）",
        variant: "destructive",
      });
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const source = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        const {naturalWidth, naturalHeight} = img;
        setImageSize({width: naturalWidth, height: naturalHeight});
      };

      img.src = source;
      setUploadedImage(source);
      setRectangles([]);
      setSelectedRect(null);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers (work for both empty and active preview)
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragDepth((d) => d + 1);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragDepth((d) => {
      const next = d - 1;
      if (next <= 0) {
        setIsDraggingOver(false);
        setIsDragAccept(false);
        return 0;
      }
      return next;
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const items = event.dataTransfer?.items;
    let accept = false;
    if (items && items.length > 0) {
      if (items.length > 1) {
        setRejectReason(DnDRejectReason.TooManyEntries);
      } else if (items[0].kind === "file" && (items[0].type?.startsWith("image/") ?? false)) {
        accept = true;
      } else {
        setRejectReason(DnDRejectReason.UnsupportedType);
      }
    }
    setIsDragAccept(accept);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = accept ? "copy" : "none";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    setIsDragAccept(false);
    setDragDepth(0);

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

    if (uploadedImage) {
      setPendingFile(file);
      setOverwriteDialogOpen(true);
      return;
    }

    if (file)
      loadImageFile(file);
  };

  // 获取缩放比例
  const getImageScale = () => {
    if (!imageRef.current) return {scaleX: 1, scaleY: 1};
    const displayWidth = imageRef.current.clientWidth;
    const displayHeight = imageRef.current.clientHeight;
    return {
      scaleX: imageSize.width / displayWidth,
      scaleY: imageSize.height / displayHeight,
    };
  };

  // 预览区坐标 => 原图像坐标
  const getRelativeCoordinates = (event: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return {x: 0, y: 0};
    const rect = imageRef.current.getBoundingClientRect();
    const {scaleX, scaleY} = getImageScale();
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const getTouchCoordinates = (event: React.TouchEvent) => {
    if (!imageRef.current || !containerRef.current) return {x: 0, y: 0};
    const rect = imageRef.current.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    const {scaleX, scaleY} = getImageScale();
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const generateUserLinkFromId = (userId: number) => {
    return `${server_link}/users/${userId}`;
  };

  const generateUserLinkFromName = (username: string) => {
    return `${server_link}/u/${username}`;
  };

  const setSelectedRect = (id: string | null) => {
    setSelectedRectId(id);

    // Restore input values to a sane default
    if (id === null) {
      setLastPositionInput({x: "0", y: "0"});
      setLastSizeInput({width: "50", height: "50"});
      return;
    }

    const target = rectangles.find(r => r.id === id);

    if (target) {
      setLastPositionInput({x: target.x.toString(), y: target.y.toString()});
      setLastSizeInput({width: target.width.toString(), height: target.height.toString()});
    } else {
      console.warn(`Cannot find a rectangle with selected id ${id}. Got:`, rectangles);
    }
  };

  const MIN_RECT_SIZE = 20;

  const selectedRectData = useMemo(
    () => selectedRect ? rectangles.find((r) => r.id === selectedRect) ?? null : null,
    [selectedRect, rectangles]
  );

  const toolOrder: EditorTool[] = ["select", "create", "delete"];

  const positionBounds = selectedRectData
    ? {
      maxX: Math.max(0, imageSize.width - selectedRectData.width),
      maxY: Math.max(0, imageSize.height - selectedRectData.height),
    }
    : {maxX: imageSize.width, maxY: imageSize.height};

  const sizeBounds = selectedRectData
    ? {
      maxWidth: Math.max(MIN_RECT_SIZE, imageSize.width - selectedRectData.x),
      maxHeight: Math.max(MIN_RECT_SIZE, imageSize.height - selectedRectData.y),
    }
    : {maxWidth: imageSize.width, maxHeight: imageSize.height};

  const clampPositionInput = (field: "x" | "y", value: string) => {
    if (!selectedRectData || value.trim() === "") return null;

    const numeric = Number(value);
    if (isNaN(numeric)) return null;

    const max = field === "x" ? positionBounds.maxX : positionBounds.maxY;
    return clamp(Math.round(numeric), 0, max);
  };

  const clampSizeInput = (field: "width" | "height", value: string) => {
    if (!selectedRectData || value.trim() === "") return null;

    const numeric = Number(value);
    if (isNaN(numeric)) return null;

    const max = field === "width" ? sizeBounds.maxWidth : sizeBounds.maxHeight;
    return clamp(Math.round(numeric), MIN_RECT_SIZE, max);
  };

  // Update input fields only after operations complete (no auto-sync during drag/resize)
  // This prevents performance issues from constant updates during interactions

  // 使用键盘移动区域与切换模式
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const withinPreview = containerRef.current?.contains(active) ?? false;
      const withinList = rectListRef.current?.contains(active) ?? false;

      // 模式切换
      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < toolOrder.length) {
          setCurrentTool(toolOrder[index]);
          event.preventDefault();
        }
        return;
      }

      // 位于预览区 / 区域列表且有选中的区域
      if (!selectedRectRef.current) return;
      if (!(withinPreview || withinList)) return;

      const selectedId = selectedRectRef.current;

      // 创建副本
      if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === "d") {
        duplicateRectangle(selectedId);
        event.preventDefault();
        return;
      }

      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        // 层级调节
        if (event.key === "-" || event.key === "=") {
          moveRectangleLayer(selectedId, event.key === "-" ? 1 : -1);
          event.preventDefault();
          return;
        }
      }

      // 删除
      if (event.key === "Delete") {
        deleteRectangle(selectedId);
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

      setRectangles((prev) => prev.map((r) => (r.id === selectedId ? {...r, x: newX, y: newY} : r)));
      // Input fields will be updated automatically via useEffect when rectangles change

      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Update input fields after arrow key release
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (selectedRectData && selectedRectRef.current === selectedRectData.id) {
          setLastPositionInput({x: selectedRectData.x.toString(), y: selectedRectData.y.toString()});
        }
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [imageSize.height, imageSize.width, toolOrder, selectedRectData]);

  const calculateResizedRect = (rect: Rectangle, handle: ResizeHandle, deltaX: number, deltaY: number) => {
    let {x, y, width, height} = rect;

    const clampWidth = (w: number, left: number) => clamp(w, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.width - left));
    const clampHeight = (h: number, top: number) => clamp(h, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.height - top));

    switch (handle) {
      case "right": {
        width = clampWidth(rect.width + deltaX, rect.x);
        break;
      }
      case "left": {
        x = clamp(rect.x + deltaX, 0, rect.x + rect.width - MIN_RECT_SIZE);
        width = clampWidth(rect.width - (x - rect.x), x);
        break;
      }
      case "bottom": {
        height = clampHeight(rect.height + deltaY, rect.y);
        break;
      }
      case "top": {
        y = clamp(rect.y + deltaY, 0, rect.y + rect.height - MIN_RECT_SIZE);
        height = clampHeight(rect.height - (y - rect.y), y);
        break;
      }
      case "top-left": {
        x = clamp(rect.x + deltaX, 0, rect.x + rect.width - MIN_RECT_SIZE);
        y = clamp(rect.y + deltaY, 0, rect.y + rect.height - MIN_RECT_SIZE);
        width = clampWidth(rect.width - (x - rect.x), x);
        height = clampHeight(rect.height - (y - rect.y), y);
        break;
      }
      case "top-right": {
        y = clamp(rect.y + deltaY, 0, rect.y + rect.height - MIN_RECT_SIZE);
        width = clampWidth(rect.width + deltaX, rect.x);
        height = clampHeight(rect.height - (y - rect.y), y);
        break;
      }
      case "bottom-left": {
        x = clamp(rect.x + deltaX, 0, rect.x + rect.width - MIN_RECT_SIZE);
        width = clampWidth(rect.width - (x - rect.x), x);
        height = clampHeight(rect.height + deltaY, rect.y);
        break;
      }
      case "bottom-right": {
        width = clampWidth(rect.width + deltaX, rect.x);
        height = clampHeight(rect.height + deltaY, rect.y);
        break;
      }
    }

    return {
      ...rect,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  };

  // 处理右键菜单
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    // 检查是否点击在矩形上
    const coords = getRelativeCoordinates(event);
    const clickedRect = rectangles.find(
      (rect) =>
        coords.x >= rect.x && coords.x <= rect.x + rect.width && coords.y >= rect.y && coords.y <= rect.y + rect.height,
    );

    if (clickedRect) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        targetId: clickedRect.id,
      });
      setSelectedRect(clickedRect.id);
    } else {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        targetId: null,
      });
    }
  };

  // 复制区域
  const duplicateRectangle = (id: string) => {
    const rectToDuplicate = rectangles.find((rect) => rect.id === id);
    if (rectToDuplicate) {
      const newRect: Rectangle = {
        ...rectToDuplicate,
        id: Date.now().toString(),
        x: rectToDuplicate.x + 20,
        y: rectToDuplicate.y + 20,
        alt: `${rectToDuplicate.alt} (副本)`,
      };
      setRectangles((prev) => [...prev, newRect]);
      setSelectedRect(newRect.id);
    }
    setContextMenu((prev) => ({...prev, visible: false}));
  };

  const moveRectangleLayer = (id: string, delta: number) => {
    setRectangles((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((rect) => rect.id === id);
      if (fromIndex === -1) return prev;

      const toIndex = fromIndex + delta;
      if (toIndex < 0 || toIndex >= next.length) return prev;

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleResizeStart = (event: React.MouseEvent | React.TouchEvent, rectId: string, handle: ResizeHandle) => {
    if (!uploadedImage || (currentTool === "create" || currentTool === "delete")) return;

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

  const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;

    // 检测是否为触摸设备
    if ("touches" in event) {
      setIsTouchDevice(true);
    }

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    // 根据当前工具执行不同操作
    switch (currentTool) {
      case "select":
        // 检查是否点击在矩形上
        const clickedRect = rectangles.find(
          (rect) =>
            coords.x >= rect.x &&
            coords.x <= rect.x + rect.width &&
            coords.y >= rect.y &&
            coords.y <= rect.y + rect.height,
        );

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
        setSelectedRect(null);

        if (coords.x <= imageSize.width && coords.y <= imageSize.height) {
          setIsDrawing(true);
          setStartPoint({ x: Math.round(coords.x), y: Math.round(coords.y) });
        }
        break;

      case "delete":
        // 检查是否点击在矩形上以删除
        const rectToDelete = rectangles.find(
          (rect) =>
            coords.x >= rect.x &&
            coords.x <= rect.x + rect.width &&
            coords.y >= rect.y &&
            coords.y <= rect.y + rect.height,
        );

        if (rectToDelete) {
          deleteRectangle(rectToDelete.id);
        }
        break;
    }

    // 防止触摸时的默认行为（如滚动）
    if ("touches" in event) {
      event.preventDefault();
    }
  };

  const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    if (resizingRect && resizeHandle && resizeStartRect) {
      const deltaX = coords.x - resizeStartPoint.x;
      const deltaY = coords.y - resizeStartPoint.y;

      const resized = calculateResizedRect(resizeStartRect, resizeHandle, deltaX, deltaY);

      setRectangles((prev) => prev.map((rect) =>
        rect.id === resizingRect ? {
          ...rect,
          x: resized.x,
          y: resized.y,
          width: resized.width,
          height: resized.height,
        } : rect,
      ));

      // Don't update input fields during drag - only update when drag ends in handlePointerUp

      if ("touches" in event) {
        event.preventDefault();
      }
      return;
    }

    // 根据当前工具执行不同操作
    if (isDrawing && currentTool === "create") {
      // 创建新矩形
      const width = Math.round(coords.x - startPoint.x);
      const height = Math.round(coords.y - startPoint.y);

      const rect: Rectangle = {
        id: "temp",
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
    if (isDrawing && currentTool === "create") {
      if (!currentRect || currentRect.width < 20 || currentRect.height < 20) {
        setIsDrawing(false);
        setCurrentRect(null);
        return;
      }

      const newRect: Rectangle = {
        ...currentRect,
        id: Date.now().toString(),
        width: Math.round(Math.min(currentRect.width, imageSize.width - currentRect.x)),
        height: Math.round(Math.min(currentRect.height, imageSize.height - currentRect.y)),
      };

      setRectangles((prev) => [...prev, newRect]);

      setSelectedRectId(newRect.id);
      setLastPositionInput({x: newRect.x.toString(), y: newRect.y.toString()});
      setLastSizeInput({width: newRect.width.toString(), height: newRect.height.toString()});

      // Upon calling of this method, we cannot get the newly added rectangle. Why?
      // setSelectedRect(newRect.id)

      setIsDrawing(false);
      setCurrentRect(null);
    }

    // 处理移动结束
    if (movingRect) {
      setMovingRect(null);
      // Update input fields after movement is complete
      const movedRect = rectangles.find(r => r.id === movingRect);
      if (movedRect && selectedRect === movingRect) {
        setLastPositionInput({x: movedRect.x.toString(), y: movedRect.y.toString()});
      }
    }

    // 处理缩放结束 - 更新输入字段
    if (resizingRect) {
      setResizingRect(null);
      setResizeHandle(null);
      setResizeStartRect(null);
      // Update input fields after resize completes
      if (selectedRectData) {
        setLastPositionInput({x: selectedRectData.x.toString(), y: selectedRectData.y.toString()});
        setLastSizeInput({width: selectedRectData.width.toString(), height: selectedRectData.height.toString()});
      }
    }
  };

  const updateRectangle = (id: string, field: keyof Rectangle,
                           value: string, castToNumber: boolean = false) => {
    // Don't update if user needs a number, and we cannot convert the source value to one.
    if (castToNumber && isNaN(Number(value)))
      return;

    console.log("updateRectangle", id, field, value);
    setRectangles((prev) => prev.map((rect) =>
      (rect.id === id ? {...rect, [field]: castToNumber ? Number(value) : value} : rect)));
  };

  const deleteRectangle = (id: string) => {
    setRectangles((prev) => prev.filter((rect) => rect.id !== id));
    setSelectedRect(null);
    setContextMenu((prev) => ({...prev, visible: false}));
  };

  const reorderRectangles = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setRectangles((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((rect) => rect.id === sourceId);
      const toIndex = next.findIndex((rect) => rect.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStartRow = (event: React.DragEvent<HTMLElement>, id: string) => {
    setDraggingRectId(id);
    event.dataTransfer.effectAllowed = "move";

    // 如有可能，将光标下拖拽提示显示列表项
    const row = (event.currentTarget as HTMLElement).closest("[data-rect-row='true']") as HTMLElement | null;
    if (row && event.clientX !== undefined && event.clientY !== undefined) {
      const rect = row.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      event.dataTransfer.setDragImage(row, offsetX, offsetY);
    }
  };

  const handleDragOverRow = (event: React.DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggingRectId && draggingRectId !== targetId) {
      reorderRectangles(draggingRectId, targetId);
    }
  };

  const handleDropOnRow = (event: React.DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    if (draggingRectId) {
      reorderRectangles(draggingRectId, targetId);
    }
    setDraggingRectId(null);
  };

  const handleDragEndRow = () => {
    setDraggingRectId(null);
  };

  const handleTouchStartRow = (id: string) => {
    setDraggingRectId(id);
    setSelectedRect(id);
  };

  const handleTouchMoveRow = (event: React.TouchEvent) => {
    if (!draggingRectId) return;
    const touch = event.touches[0];
    if (!touch) return;

    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetRow = target?.closest("[data-rect-row='true']") as HTMLElement | null;
    const targetId = targetRow?.dataset.rectId;

    if (targetId && targetId !== draggingRectId) {
      reorderRectangles(draggingRectId, targetId);
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const handleTouchEndRow = () => {
    setDraggingRectId(null);
  };

  const generateImageMapHtml = () => {
    if (!uploadedImage || rectangles.length === 0) return "<!-- 上传图片并创建区域后，HTML 代码将在这里显示 -->";

    const name = mapName ?? "imagemap";
    const areas = rectangles
      .map(
        (rect) =>
          `  <area shape="rect" coords="${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.x + rect.width)},${Math.round(rect.y + rect.height)}" href="${rect.href}" alt="${rect.alt}">`,
      )
      .join("\n");

    return `<img src="${imagePath ?? imageName ?? "your-image.jpg"}" alt="Collab Image" usemap="#${name}">
<map name="${name}">
${areas}
</map>`;
  };

  const toPercent = (num: number, total: number) => {
    return Math.round(num / total * 1000) / 10;
  };

  const generateImageMapBBCode = () => {
    if (!uploadedImage || rectangles.length === 0) return "[i]上传图片并创建区域后，BBCode 代码将在这里显示[/i]";

    const areas = rectangles
      .map(
        (rect) =>
          `${toPercent(rect.x, imageSize.width)} ${toPercent(rect.y, imageSize.height)}`
          + ` ${toPercent(rect.width, imageSize.width)} ${toPercent(rect.height, imageSize.height)}`
          + ` ${rect.href.trim() === "" ? common.urlPlaceholder : rect.href.trim()}${rect.alt.trim() === "" || ` ${rect.alt.trim()}`}`,
      )
      .join("\n");

    return `[imagemap]\n${imagePath ?? imageName ?? "your-image.jpg"}\n${areas}\n[/imagemap]`;
  };

  // 获取工具按钮的样式
  const getToolButtonClass = (tool: EditorTool) => {
    return `p-2 rounded-md transition-all ease-out duration-200 ${
      currentTool === tool ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-foreground/10"
    }`;
  };

  // 获取鼠标样式
  const getCursorStyle = () => {
    switch (currentTool) {
      case "create":
        return "cursor-crosshair";
      case "delete":
        return "cursor-no-drop";
      default:
        return "cursor-default";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="flex-title text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">ImageMap </span>
            <span>编辑器</span>
            <HelpIconButton section="imagemap" />
          </h1>
          <p className="text-secondary-foreground">划定可点击区域，以便在个人资料等中使用</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Preview Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex-title text-xl font-semibold">
                <Eye/>
                <span>预览区</span>
              </h2>
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"
                       id="image-upload"/>
                <label htmlFor="image-upload">
                  <Button asChild className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4"/>
                      上传图片
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* 工具栏 */}
            {uploadedImage && (
              <div className="bg-card rounded-md shadow p-1 flex space-x-1 select-none">
                <button
                  className={getToolButtonClass("select")}
                  onClick={() => setCurrentTool("select")}
                  title="选择"
                >
                  <MousePointer className="w-5 h-5"/>
                </button>
                <button
                  className={getToolButtonClass("create")}
                  onClick={() => setCurrentTool("create")}
                  title="创建"
                >
                  <Square className="w-5 h-5"/>
                </button>
                <button
                  className={getToolButtonClass("delete")}
                  onClick={() => setCurrentTool("delete")}
                  title="删除"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>
              </div>
            )}

            <Card className={`${uploadedImage ? "h-auto" : "h-96"} lg:min-h-[500px]`}>
              <CardContent className={`p-4 ${uploadedImage ? "h-auto" : "h-full"}`}>
                {uploadedImage ? (
                  <div
                    ref={containerRef}
                    className={`relative w-full touch-none select-none flex items-center justify-center
                    ${getCursorStyle() == "cursor-crosshair" ? "cursor-crosshair" : ""}`}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    onContextMenu={handleContextMenu}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    tabIndex={0}
                    style={{touchAction: "none", userSelect: "none", minHeight: "100%"}}
                  >
                    <img
                      ref={imageRef}
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded"
                      className="w-full object-contain select-none"
                      draggable={false}
                      style={{userSelect: "none"}}
                    />

                    {/* 拖放状态显示 */}
                    {isDraggingOver && <DragAndDropOverlay isRounded={!uploadedImage} isDragAccepted={isDragAccept}
                                                           rejectReason={rejectReason}/>}

                    {/* Existing rectangles */}
                    {/* 显示时将原图像坐标缩放到预览区 */}
                    {rectangles.map((rect, index) => {
                      const {scaleX, scaleY} = getImageScale();
                      const handleSize = isTouchDevice ? 16 : 10;
                      const handleOffset = handleSize / 2;
                      const handleConfigs: Array<{
                        handle: ResizeHandle;
                        style: React.CSSProperties;
                        cursor: string
                      }> = [
                        {handle: "top-left", style: {top: -handleOffset, left: -handleOffset}, cursor: "nwse-resize"},
                        {
                          handle: "top",
                          style: {top: -handleOffset, left: "50%", transform: "translateX(-50%)"},
                          cursor: "ns-resize",
                        },
                        {handle: "top-right", style: {top: -handleOffset, right: -handleOffset}, cursor: "nesw-resize"},
                        {
                          handle: "right",
                          style: {top: "50%", right: -handleOffset, transform: "translateY(-50%)"},
                          cursor: "ew-resize",
                        },
                        {
                          handle: "bottom-right",
                          style: {bottom: -handleOffset, right: -handleOffset},
                          cursor: "nwse-resize",
                        },
                        {
                          handle: "bottom",
                          style: {bottom: -handleOffset, left: "50%", transform: "translateX(-50%)"},
                          cursor: "ns-resize",
                        },
                        {
                          handle: "bottom-left",
                          style: {bottom: -handleOffset, left: -handleOffset},
                          cursor: "nesw-resize",
                        },
                        {
                          handle: "left",
                          style: {top: "50%", left: -handleOffset, transform: "translateY(-50%)"},
                          cursor: "ew-resize",
                        },
                      ];
                      // 十字光标较为特殊（画框），在此处先处理
                      return (
                        <div
                          key={rect.id}
                          className={`absolute border-2 bg-primary/20 select-none touch-manipulation transition-colors ease-out duration-200 ${
                            selectedRect === rect.id ? "border-primary border-4" : "border-primary/40"
                          } ${isTouchDevice && "min-w-[44px] min-h-[44px]"} ${getCursorStyle()} ${currentTool === "delete" && "hover:border-red-400"}`}
                          style={{
                            left: rect.x / scaleX,
                            top: rect.y / scaleY,
                            width: Math.max(rect.width / scaleX, isTouchDevice ? 44 : rect.width / scaleX),
                            height: Math.max(rect.height / scaleY, isTouchDevice ? 44 : rect.height / scaleY),
                            cursor: currentTool === "select" ? "move"
                              : currentTool === "delete" ? "no-drop"
                                : currentTool === "create" ? "crosshair" : "pointer",
                            userSelect: "none",
                            zIndex: rectangles.length - index,
                          }}
                        >
                          {rect.alt.trim() &&
                            <div
                              className={`absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1 rounded select-none max-w-full truncate ${
                                isTouchDevice ? "text-sm px-2 py-1" : ""
                              }`}
                            >
                              {rect.alt.trim()}
                            </div>}

                          {selectedRect === rect.id && (
                            <>
                              {handleConfigs.map((item) => (
                                <div
                                  key={item.handle}
                                  className="absolute bg-primary border border-white shadow-sm"
                                  style={{
                                    ...item.style,
                                    width: handleSize,
                                    height: handleSize,
                                    cursor: item.cursor,
                                  }}
                                  onMouseDown={(e) => handleResizeStart(e, rect.id, item.handle)}
                                  onTouchStart={(e) => handleResizeStart(e, rect.id, item.handle)}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Current drawing rectangle */}
                    {currentRect && (() => {
                      const {scaleX, scaleY} = getImageScale();
                      return (
                        <div
                          className="absolute border-2 border-red-400 bg-red-500 bg-opacity-20 select-none"
                          style={{
                            left: currentRect.x / scaleX,
                            top: currentRect.y / scaleY,
                            width: currentRect.width / scaleX,
                            height: currentRect.height / scaleY,
                            userSelect: "none",
                          }}
                        />
                      );
                    })()}

                    {/* 自定义右键菜单 */}
                    {contextMenu.visible && (
                      <div
                        ref={contextMenuRef}
                        className="fixed bg-card rounded-md shadow-lg py-1 z-50 min-w-[160px] select-none"
                        style={{
                          left: contextMenu.x,
                          top: contextMenu.y,
                          userSelect: "none",
                        }}
                      >
                        {contextMenu.targetId ? (
                          <>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-card-foreground/10 flex items-center gap-2"
                              onClick={() => duplicateRectangle(contextMenu.targetId!)}
                            >
                              <Copy className="w-4 h-4"/>
                              创建副本
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-card-foreground/10 text-destructive flex items-center gap-2"
                              onClick={() => deleteRectangle(contextMenu.targetId!)}
                            >
                              <Trash className="w-4 h-4"/>
                              删除区域
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-card-foreground/10 flex items-center gap-2"
                              onClick={() => {
                                setCurrentTool("create");
                                setContextMenu((prev) => ({...prev, visible: false}));
                              }}
                            >
                              <Square className="w-4 h-4"/>
                              创建新区域
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-card-foreground/10 flex items-center gap-2"
                              onClick={() => {
                                setContextMenu((prev) => ({...prev, visible: false}));
                              }}
                            >
                              <X className="w-4 h-4"/>
                              取消
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative h-full flex items-center justify-center border-2 border-dashed hover:border-primary rounded-lg animate-simple"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                      <p className="text-muted-foreground">先上传一张图片</p>
                      <p className="text-muted-foreground">（支持拖放）</p>
                    </div>

                    {/* 拖放状态显示 */}
                    {isDraggingOver && <DragAndDropOverlay isRounded={!uploadedImage} isDragAccepted={isDragAccept}
                                                           rejectReason={rejectReason}/>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Setting Area */}
          <div className="space-y-4">
            <h2 className="flex-title text-xl font-semibold">
              <Settings/>
              <span>设置区</span>
            </h2>

            {/* Image Properties */}
            {uploadedImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="items-center space-y-3">
                    <h3 className="font-medium">
                      图像属性
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">图片地址</label>
                      <input
                        type="url"
                        defaultValue={imagePath ?? ""}
                        onChange={(e) => setImagePath(e.target.value.trim() === "" ? null : e.target.value.trim())}
                        className={`w-full px-3 py-2 border hover:border-primary rounded-md text-sm ${
                          isTouchDevice ? "py-3 text-base" : ""
                        }`}
                        placeholder={common.urlPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ImageMap 名称</label>
                      <input
                        defaultValue={mapName ?? ""}
                        onChange={(e) => setMapName(e.target.value.trim() === "" ? null : e.target.value.trim())}
                        className={`w-full px-3 py-2 border hover:border-primary rounded-md text-sm ${
                          isTouchDevice ? "py-3 text-base" : ""
                        }`}
                        placeholder="imagemap"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {uploadedImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">区域列表</h3>
                  </div>

                  {rectangles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">还没有区域，先在预览区创建。</p>
                  ) : (
                    <div className="space-y-2" ref={rectListRef}>
                      {rectangles.map((rect, index) => (
                        <div
                          key={rect.id}
                          className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors min-w-0 ${
                            selectedRect === rect.id ? "border-primary bg-primary/15" : "border-border bg-card"
                          } ${draggingRectId === rect.id ? "opacity-70" : "hover:bg-primary/5"}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedRect(rect.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedRect(rect.id);
                            }
                          }}
                          onDragOver={(e) => handleDragOverRow(e, rect.id)}
                          onDrop={(e) => handleDropOnRow(e, rect.id)}
                          data-rect-row="true"
                          data-rect-id={rect.id}
                        >
                          <div className="flex w-full items-center gap-3 min-w-0">
                            <div
                              className="h-full text-muted-foreground hover:text-foreground cursor-grab flex-shrink-0 -ml-3 pl-3 pr-2 py-2 rounded-md"
                              onDragStart={(e) => handleDragStartRow(e, rect.id)}
                              onDragEnd={handleDragEndRow}
                              draggable
                              aria-label="拖动以调整顺序"
                              tabIndex={-1}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTouchStartRow(rect.id);
                              }}
                              onTouchMove={(e) => {
                                e.preventDefault();
                                handleTouchMoveRow(e);
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                handleTouchEndRow();
                              }}
                              style={{touchAction: "none"}}
                            >
                              <GripVertical className="w-4 h-4"/>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className={`text-sm font-medium text-left truncate ${rect.alt || "italic"}`}>{rect.alt || `区域 ${index + 1}`}</span>
                              <span
                                className={`text-xs text-muted-foreground text-left truncate ${rect.href || "italic"}`}>{rect.href || "未设置链接"}</span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4"/>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  duplicateRectangle(rect.id);
                                }}
                              >
                                <Copy className="w-4 h-4 flex-shrink-0"/>
                                <span className="truncate">创建副本</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  deleteRectangle(rect.id);
                                }}
                              >
                                <Trash className="w-4 h-4 flex-shrink-0"/>
                                <span className="truncate">删除</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rectangle Properties */}
            {selectedRect && selectedRectData && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      区域属性
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateRectangle(selectedRect)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4"/>
                        复制
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteRectangle(selectedRect)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4"/>
                        删除
                      </Button>
                    </div>
                  </div>
                  {selectedRectData && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">链接地址</label>
                        <input
                          type="url"
                          value={selectedRectData.href || ""}
                          onChange={(e) => updateRectangle(selectedRect, "href", e.target.value)}
                          className={`w-full px-3 py-2 border hover:border-primary rounded-md text-sm ${
                            isTouchDevice ? "py-3 text-base" : ""
                          }`}
                          placeholder={common.urlPlaceholder}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">替代文本</label>
                        <input
                          type="text"
                          value={selectedRectData.alt || ""}
                          onChange={(e) => updateRectangle(selectedRect, "alt", e.target.value)}
                          className={`w-full px-3 py-2 border hover:border-primary rounded-md text-sm ${
                            isTouchDevice ? "py-3 text-base" : ""
                          }`}
                          placeholder="描述文本"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">用户信息</label>
                          <input
                            value={userInfo}
                            onChange={(e) => setUserInfo(e.target.value.trim())}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userInfo.length == 0 || isNaN(Number(userInfo))}
                            onClick={() => updateRectangle(selectedRect, "href",
                              generateUserLinkFromId(Number(userInfo)))}
                            className="flex items-center gap-1"
                          >
                            <Hash className="w-4 h-4"/>
                            <span className="truncate">作为 ID 填入</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userInfo.length == 0}
                            onClick={() => updateRectangle(selectedRect, "href",
                              generateUserLinkFromName(userInfo))}
                            className="flex items-center gap-1"
                          >
                            <UserRound className="w-4 h-4"/>
                            <span className="truncate">作为用户名填入</span>
                          </Button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">X 坐标</label>
                          <input
                            type="number"
                            value={lastPositionInput.x}
                            min={0}
                            max={positionBounds.maxX}
                            onChange={(e) => {
                              const clamped = clampPositionInput("x", e.target.value);
                              if (clamped === null) return;

                              setLastPositionInput({
                                ...lastPositionInput,
                                x: clamped.toString(),
                              });
                              updateRectangle(selectedRect, "x", clamped.toString(), true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Y 坐标</label>
                          <input
                            type="number"
                            value={lastPositionInput.y}
                            min={0}
                            max={positionBounds.maxY}
                            onChange={(e) => {
                              const clamped = clampPositionInput("y", e.target.value);
                              if (clamped === null) return;

                              setLastPositionInput({
                                ...lastPositionInput,
                                y: clamped.toString(),
                              });
                              updateRectangle(selectedRect, "y", clamped.toString(), true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">宽度</label>
                          <input
                            type="number"
                            value={lastSizeInput.width}
                            min={MIN_RECT_SIZE}
                            max={sizeBounds.maxWidth}
                            onChange={(e) => {
                              const clamped = clampSizeInput("width", e.target.value);
                              if (clamped === null) return;

                              setLastSizeInput({...lastSizeInput, width: clamped.toString()});
                              updateRectangle(selectedRect, "width", clamped.toString(), true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">高度</label>
                          <input
                            type="number"
                            value={lastSizeInput.height}
                            min={MIN_RECT_SIZE}
                            max={sizeBounds.maxHeight}
                            onChange={(e) => {
                              const clamped = clampSizeInput("height", e.target.value);
                              if (clamped === null) return;

                              setLastSizeInput({...lastSizeInput, height: clamped.toString()});
                              updateRectangle(selectedRect, "height", clamped.toString(), true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Code Area */}
          <div className="space-y-4">
            <h2 className="flex-title text-xl font-semibold">
              <Code/>
              <span>代码区</span>
            </h2>

            {/* Generated Code */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">HTML 代码</h3>
                  <Button onClick={() => navigator.clipboard.writeText(generateImageMapHtml())}
                          disabled={rectangles.length === 0} size="sm">
                    <Copy className="w-4 h-4"/>
                    复制代码
                  </Button>
                </div>
                <div
                  className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                  <pre><code dangerouslySetInnerHTML={{
                    __html: hljs.highlight(generateImageMapHtml(), {language: "html"}).value,
                  }}/></pre>
                </div>
              </CardContent>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">BBCode 代码</h3>
                  <Button onClick={() => navigator.clipboard.writeText(generateImageMapBBCode())}
                          disabled={rectangles.length === 0} size="sm">
                    <Copy className="w-4 h-4"/>
                    复制代码
                  </Button>
                </div>
                <div
                  className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                  <pre><code dangerouslySetInnerHTML={{
                    __html: hljs.highlight(generateImageMapBBCode(), {language: "bbcode"}).value,
                  }}/></pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* 覆盖确认对话框 */}
      <AlertDialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-row items-center gap-2">
              <OctagonAlert/>
              加载新图片？
            </AlertDialogTitle>
            <AlertDialogDescription>
              当前编辑的图像与 ImageMap 将会被覆盖，此操作不可逆。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingFile(null);
            }}>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive/50 hover:bg-destructive" onClick={() => {
              if (pendingFile) {
                loadImageFile(pendingFile);
              }
              setPendingFile(null);
              setOverwriteDialogOpen(false);
            }}>覆盖</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
