"use client";

import type React from "react";
import type { ReactElement } from "react";
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
  CircleUserRound,
  Code,
  Copy,
  Download,
  Eye,
  FolderOpen,
  GripVertical,
  Hash,
  LayoutDashboard,
  List,
  MoreVertical,
  MousePointer,
  MousePointerClick,
  OctagonAlert,
  Settings,
  Square,
  Trash,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  clamp,
  cn,
  generateId,
  generateImageMapBBCode,
  generateImageMapHtml,
  generateUserLinkFromId,
  generateUserLinkFromName,
} from "@/lib/utils";
import DragAndDropOverlay, { DnDRejectReason } from "@/app/imagemap/dnd-overlay";
import { common } from "@/app/common";
import hljs from "highlight.js/lib/core";
import html from "highlight.js/lib/languages/xml";
import { HelpIconButton } from "@/components/help-icon-button";
import { registerBBCodeHighlight } from "@/lib/hljs-support";
import { ExportDialog } from "@/components/imagemap/export-dialog";
import { ImportDialog } from "@/components/imagemap/import-dialog";
import { ImageMapConfig, Rectangle, RectangleType } from "@/app/imagemap/types";
import type { IAvatarStyle } from "@/app/avatar/styles/IAvatarStyle";
import { ClassicAvatarStyle } from "@/app/avatar/styles/ClassicAvatarStyle";
import { ModernAvatarStyle } from "@/app/avatar/styles/ModernAvatarStyle";
import { SimpleAvatarStyle } from "@/app/avatar/styles/SimpleAvatarStyle";
import { AvatarBox, generateCompositeImage, getAvatarDataURL, isRenderableAvatar } from "@/app/imagemap/avatar-render";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { fileTypeFromBlob } from "file-type";

// 大小调整的八个点
type ResizeHandle = "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Tool {
  key: string;
  name: string;
  icon: ReactElement;
}

// 工具栏中可用工具
const tools: Tool[] = [
  {key: "select", name: "select", icon: <MousePointer className="w-5 h-5"/>},
  {key: "create", name: "create", icon: <Square className="w-5 h-5"/>},
  {key: "create-avatar", name: "createAvatar", icon: <CircleUserRound className="w-5 h-5"/>},
  {key: "delete", name: "delete", icon: <Trash2 className="w-5 h-5"/>},
];

type EditorTool = Tool["key"];

// 注册所有可用头像样式（与 avatar/page.tsx 保持一致）
const STYLE_REGISTRY = [
  {key: "classic", style: new ClassicAvatarStyle() as IAvatarStyle},
  {key: "modern", style: new ModernAvatarStyle() as IAvatarStyle},
  {key: "simple", style: new SimpleAvatarStyle() as IAvatarStyle},
] as const;

export default function ImagemapEditorPage() {
  const t = useTranslations("imagemap");
  const ta = useTranslations("avatar");
  const tc = useTranslations("common");

  // Image states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | undefined>(undefined);
  const [imageSize, setImageSize] = useState({width: 0, height: 0});

  // Custom image properties
  const [imagePath, setImagePath] = useState<string | undefined>(undefined);
  const [mapName, setMapName] = useState<string | undefined>(undefined);

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
  const [_, setWindowResizeCounter] = useState(0);

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

  // Export & Import dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Layout state
  const [preferLayout, setPreferLayout] = useState<"two-column" | "single-column">("two-column");

  const {toast} = useToast();

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectListRef = useRef<HTMLDivElement>(null);
  const rectanglesRef = useRef<Rectangle[]>([]);
  const selectedRectRef = useRef<string | null>(null);
  const avatarCacheRef = useRef<Map<string, { comp: React.FC; signature: string }>>(new Map());
  const [avatarNaturalSizes, setAvatarNaturalSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [isExporting, setIsExporting] = useState(false);

  const handleSize = isTouchDevice ? 16 : 10;
  const handleOffset = handleSize / 2;
  const handleConfigs: Array<{
    handle: ResizeHandle;
    style: React.CSSProperties;
    cursor: string;
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

  // 注册 hljs 语言
  hljs.registerLanguage("html", html);
  registerBBCodeHighlight();

  useEffect(() => {
    rectanglesRef.current = rectangles;
  }, [rectangles]);

  useEffect(() => {
    selectedRectRef.current = selectedRect;
  }, [selectedRect]);

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
      loadImageFile(file).then(_ => {
      });
    }
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
          const t = it.type || "";
          if (t.startsWith("image/")) imageCount++;
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

    if (uploadedImage) {
      setPendingFile(file);
      setOverwriteDialogOpen(true);
      return;
    }

    if (file) loadImageFile(file).then(_ => {
    });
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

  const setSelectedRect = (id: string | null) => {
    setSelectedRectId(id);

    // Restore input values to a sane default
    if (id === null) {
      setLastPositionInput({x: "0", y: "0"});
      setLastSizeInput({width: "50", height: "50"});
      return;
    }

    const target = rectangles.find((r) => r.id === id);

    if (target) {
      setLastPositionInput({x: target.x.toString(), y: target.y.toString()});
      setLastSizeInput({width: target.width.toString(), height: target.height.toString()});
    } else {
      console.warn(`Cannot find a rectangle with selected id ${id}. Got:`, rectangles);
    }
  };

  const MIN_RECT_SIZE = 20;

  const selectedRectData = useMemo(
    () => (selectedRect ? rectangles.find((r) => r.id === selectedRect) ?? null : null),
    [selectedRect, rectangles],
  );

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
      const withinPreview = containerRef.current?.contains(active) ?? false;
      const withinList = rectListRef.current?.contains(active) ?? false;

      // 模式切换
      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < tools.length) {
          setCurrentTool(tools[index].key);
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
  }, [imageSize.height, imageSize.width, selectedRectData]);

  const calculateResizedRect = (rect: Rectangle, handle: ResizeHandle, deltaX: number, deltaY: number) => {
    let {x, y, width, height} = rect;

    const clampWidth = (w: number, left: number) =>
      clamp(w, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.width - left));
    const clampHeight = (h: number, top: number) =>
      clamp(h, MIN_RECT_SIZE, Math.max(MIN_RECT_SIZE, imageSize.height - top));

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
    // 当为头像区域时，锁定宽高比（基于组件实时测量 size，回退样式 size）并以左上角为锚点
    if (rect.type === RectangleType.Avatar) {
      const styleKey = rect.avatar?.styleKey ?? "simple";
      const styleObj = STYLE_REGISTRY.find((s) => s.key === styleKey)?.style;
      const measured = avatarNaturalSizes[rect.id];
      const naturalW = measured?.width ?? styleObj?.size.width ?? Math.max(width, MIN_RECT_SIZE);
      const naturalH = measured?.height ?? styleObj?.size.height ?? Math.max(height, MIN_RECT_SIZE);
      const ar = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 1;

      const anchorX = rect.x; // 锚定左上角，简化约束行为
      const anchorY = rect.y;
      const maxW = Math.max(MIN_RECT_SIZE, imageSize.width - anchorX);
      const maxH = Math.max(MIN_RECT_SIZE, imageSize.height - anchorY);

      // 以当前宽度为主，计算锁定后的高度，并再回推宽度，确保整数与边界
      let lockedHeight = clampHeight(Math.round(width / ar), anchorY);
      lockedHeight = clamp(lockedHeight, MIN_RECT_SIZE, maxH);
      let lockedWidth = clampWidth(Math.round(lockedHeight * ar), anchorX);
      lockedWidth = clamp(lockedWidth, MIN_RECT_SIZE, maxW);
      // 依比例重算高度，避免因宽度边界导致误差
      lockedHeight = clamp(Math.round(lockedWidth / ar), MIN_RECT_SIZE, maxH);

      x = anchorX;
      y = anchorY;
      width = lockedWidth;
      height = lockedHeight;
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
    // 检查是否点击在矩形上
    const coords = getRelativeCoordinates(event);
    const clickedRect = rectangles.find(
      (rect) =>
        coords.x >= rect.x && coords.x <= rect.x + rect.width && coords.y >= rect.y && coords.y <= rect.y + rect.height,
    );

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

  const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;
    // 忽略鼠标右键，避免与上下文菜单交叉交互
    if ("button" in event && (event as React.MouseEvent).button === 2) {
      return;
    }

    // 检测是否为触摸设备
    if ("touches" in event) {
      setIsTouchDevice(true);
    }

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    // 检查是否点击在矩形上
    const clickedRect = rectangles.find(
      (rect) =>
        coords.x >= rect.x && coords.x <= rect.x + rect.width && coords.y >= rect.y && coords.y <= rect.y + rect.height,
    );

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
          setStartPoint({x: Math.round(coords.x), y: Math.round(coords.y)});
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

  const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!uploadedImage) return;

    const coords = "touches" in event ? getTouchCoordinates(event) : getRelativeCoordinates(event as React.MouseEvent);

    if (resizingRect && resizeHandle && resizeStartRect) {
      const deltaX = coords.x - resizeStartPoint.x;
      const deltaY = coords.y - resizeStartPoint.y;

      const resized = calculateResizedRect(resizeStartRect, resizeHandle, deltaX, deltaY);

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

      // 初始化 Avatar 区域的默认配置
      if (newRect.type === RectangleType.Avatar) {
        (newRect as any).avatar = {
          styleKey: "simple",
          imageUrl: "",
          username: "",
          countryCode: "",
        };

        // 绘制结束后，依据组件测量/样式宽高比自动调整为等比（contain）大小，锚定左上角
        const styleObj = STYLE_REGISTRY.find((s) => s.key === "simple")?.style;
        const measured = avatarNaturalSizes[newRect.id];
        const naturalW = measured?.width ?? styleObj?.size.width ?? newRect.width;
        const naturalH = measured?.height ?? styleObj?.size.height ?? newRect.height;
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
      const movedRect = rectangles.find((r) => r.id === movingRect);
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

  const updateRectangle = (id: string, field: keyof Rectangle, value: string, castToNumber: boolean = false) => {
    // Don't update if user needs a number, and we cannot convert the source value to one.
    if (castToNumber && isNaN(Number(value))) return;

    console.log("updateRectangle", id, field, value);
    setRectangles((prev) =>
      prev.map((rect) => (rect.id === id ? {...rect, [field]: castToNumber ? Number(value) : value} : rect)),
    );
  };

  const updateRectangleType = (id: string, nextType: RectangleType) => {
    setRectangles((prev) =>
      prev.map((rect) => {
        if (rect.id !== id) return rect;
        const base: Rectangle = {...rect, type: nextType};
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
        } else {
          const {avatar, ...rest} = base as any;
          // 清理缓存，避免残留的头像组件
          avatarCacheRef.current.delete(id);
          // 清理测量尺寸缓存
          setAvatarNaturalSizes((prev) => {
            const {[id]: _omit, ...restSizes} = prev;
            return restSizes;
          });
          return rest as Rectangle;
        }
      }),
    );
  };

  const updateAvatarField = (
    id: string,
    field: "styleKey" | "imageUrl" | "username" | "countryCode",
    value: string,
  ) => {
    setRectangles((prev) =>
      prev.map((rect) => {
        if (rect.id !== id) return rect;
        if (rect.type !== RectangleType.Avatar) return rect;
        const avatar = rect.avatar ?? {styleKey: "simple", imageUrl: "", username: "", countryCode: ""};
        return {...rect, avatar: {...avatar, [field]: value}};
      }),
    );
  };

  const deleteRectangle = (id: string) => {
    setRectangles((prev) => prev.filter((rect) => rect.id !== id));
    setSelectedRect(null);

    // 清理头像缓存
    avatarCacheRef.current.delete(id);
    // 清理测量尺寸缓存
    setAvatarNaturalSizes((prev) => {
      const {[id]: _omit, ...rest} = prev;
      return rest;
    });
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

  // 生成导出数据
  const generateExportData = (): ImageMapConfig => {
    return {
      imagePath: imagePath,
      imageName: imageName,
      mapName: mapName,
      rectangles: rectangles,
    };
  };

  // 处理导入数据
  const handleImportData = (data: ImageMapConfig) => {
    // 新导入配置前清理头像组件缓存，避免旧组件干扰
    avatarCacheRef.current.clear();
    // 清理测量尺寸缓存
    setAvatarNaturalSizes({});
    if (data.imagePath) setImagePath(data.imagePath);

    if (data.imageName) setImageName(data.imageName);

    if (data.mapName) setMapName(data.mapName);

    // 清空选中状态
    setSelectedRect(null);
    setRectangles(data.rectangles);
  };

  // 获取工具按钮的样式
  const getToolButtonClass = (tool: EditorTool) => {
    return `p-2 rounded-md transition-all ease-out duration-200 ${
      currentTool === tool
        ? "bg-primary text-primary-foreground"
        : "bg-background text-foreground hover:bg-foreground/10"
    }`;
  };

  // 导出高质量图像，使用与预览区相同的渲染逻辑
  const handleExportAvatars = async () => {
    if (!uploadedImage || isExporting) return;
    setIsExporting(true);

    const base = (mapName && mapName.trim()) || (imageName && imageName.split(".")[0]) || "imagemap";

    try {
      // 获取预览使用的当前缩放比例
      const {scaleX, scaleY} = getImageScale();

      // 生成所有头像的 dataURL，传递缩放信息
      const avatarPromises = rectangles
        .filter(isRenderableAvatar)
        .map(async (rect) => {
          const avatarDataURL = await getAvatarDataURL(
            rect,
            STYLE_REGISTRY,
            avatarCacheRef,
            avatarNaturalSizes[rect.id],
            // Keep previous measured sizes as the preview uses them
            (() => {
            }),
            scaleX,
            scaleY,
          );
          return {
            data: avatarDataURL,
            attrs: rect,
          };
        });

      // 等待所有头像生成完成
      const avatarsWithData = await Promise.all(avatarPromises);

      // 过滤掉生成失败的头像
      const validAvatars = avatarsWithData
        .filter((avatar): avatar is { data: string; attrs: typeof avatar.attrs } => {
          return avatar.data !== null;
        });

      // 生成合成图像
      const compositeDataURL = await generateCompositeImage(
        uploadedImage,
        validAvatars,
      );

      if (compositeDataURL) {
        // 创建下载链接
        const link = document.createElement("a");
        link.href = compositeDataURL;
        link.download = `exported-${base}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("无法生成合成图像");
      }
    } catch (error) {
      console.error("导出失败:", error);
      toast({
        title: t("error.exportFailed"),
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 grid items-center md:grid-cols-2">
          <div>
            <h1 className="flex-title text-3xl font-bold text-foreground mb-2">
              <span className="text-primary">{t("title")}</span>
              <HelpIconButton section="imagemap"/>
            </h1>
            <p className="text-secondary-foreground">{t("description")}</p>
          </div>
          <div className="justify-self-end-safe mt-2 md:mt-0">
            <Tabs value={preferLayout}
                  onValueChange={(value) => setPreferLayout(value as "two-column" | "single-column")}>
              <TabsList>
                <TabsTrigger value="two-column"><LayoutDashboard/></TabsTrigger>
                <TabsTrigger value="single-column"><List/></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div
          className={`grid gap-8 h-full transition-all duration-300 ease-in-out ${preferLayout === "two-column" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Preview Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex-title text-xl font-semibold">
                <Eye/>
                <span>{tc("section.preview")}</span>
              </h2>
              <div className="flex items-center gap-2">
                {uploadedImage && (
                  <Button
                    onClick={handleExportAvatars}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <span
                          className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"/>
                        {t("toolbar.save")}中…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4"/>
                        {t("toolbar.save")}
                      </>
                    )}
                  </Button>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload"/>
                <label htmlFor="image-upload">
                  <Button asChild>
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4"/>
                      {t("toolbar.selectImage")}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* 工具栏 */}
            {uploadedImage && (
              <div className="bg-card rounded-md shadow-sm p-1 flex space-x-1 select-none">
                {tools.map((tool, index) => (
                  <Tooltip key={tool.key}>
                    <TooltipTrigger asChild>
                      <button
                        className={getToolButtonClass(tool.key)}
                        onClick={() => setCurrentTool(tool.key)}
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
                ))}
              </div>
            )}

            <Card className={`${uploadedImage ? "h-auto" : "h-96"} lg:min-h-125`}>
              <CardContent className={`p-4 ${uploadedImage ? "h-auto" : "h-full"}`}>
                {uploadedImage ? (
                  <ContextMenu onOpenChange={(open) => {
                    if (!open) setContextTargetId(null);
                  }}>
                    <ContextMenuTrigger asChild>
                      <div
                        ref={containerRef}
                        className={`relative w-full min-h-full touch-none select-none flex items-center justify-center
                    ${currentTool.startsWith("create") && "cursor-crosshair"}`}
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
                      >
                        <img
                          ref={imageRef}
                          src={uploadedImage}
                          alt="Uploaded"
                          className="w-full object-contain select-none"
                          draggable={false}
                        />

                        {/* 拖放状态显示 */}
                        {isDraggingOver && (
                          <DragAndDropOverlay
                            isRounded={!uploadedImage}
                            rejectReason={rejectReason}
                          />
                        )}

                        {/* Existing rectangles */}
                        {/* 显示时将原图像坐标缩放到预览区 */}
                        {rectangles.map((rect, index) => {
                          const {scaleX, scaleY} = getImageScale();

                          // 十字光标较为特殊（画框），在此处先处理
                          return (
                            <div
                              key={rect.id}
                              className={cn(
                                "absolute border-2 bg-primary/20 select-none touch-manipulation transition-colors ease-out duration-200",
                                selectedRect === rect.id ? "border-primary" : "border-primary/40",
                                isTouchDevice && "min-w-11 min-h-11",
                                currentTool === "delete" && "hover:border-red-400",
                                // 允许选中区域的八个点在边界外正常显示
                                "overflow-visible box-border",
                              )}
                              style={{
                                left: rect.x / scaleX,
                                top: rect.y / scaleY,
                                width: Math.max(rect.width / scaleX, isTouchDevice ? 44 : rect.width / scaleX),
                                height: Math.max(rect.height / scaleY, isTouchDevice ? 44 : rect.height / scaleY),
                                cursor:
                                  currentTool === "select"
                                    ? "move"
                                    : currentTool === "delete"
                                      ? "no-drop"
                                      : currentTool === "create" || currentTool === "create-avatar"
                                        ? "crosshair"
                                        : "pointer",
                                zIndex: rectangles.length - index,
                              }}
                            >
                              {/* Avatar 区域渲染：在矩形中显示头像卡片 */}
                              {(() => {
                                const displayW = isTouchDevice ? Math.max(rect.width / scaleX, 44) : rect.width / scaleX;
                                const displayH = isTouchDevice ? Math.max(rect.height / scaleY, 44) : rect.height / scaleY;

                                return isRenderableAvatar(rect) ? (
                                  <AvatarBox
                                    rect={rect}
                                    displayW={displayW}
                                    displayH={displayH}
                                    styleRegistry={STYLE_REGISTRY}
                                    cacheRef={avatarCacheRef}
                                    measured={avatarNaturalSizes[rect.id]}
                                    onMeasure={(w, h) => {
                                      setAvatarNaturalSizes((prev) => {
                                        const current = prev[rect.id];
                                        if (current && current.width === w && current.height === h) return prev;
                                        return {...prev, [rect.id]: {width: w, height: h}};
                                      });
                                    }}
                                  />
                                ) : null;
                              })()}
                              {rect.alt.trim() && (
                                <div
                                  className={cn(
                                    "absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1 rounded select-none max-w-full truncate",
                                    isTouchDevice && "text-sm px-2 py-1",
                                  )}
                                >
                                  {rect.alt.trim()}
                                </div>
                              )}

                              {selectedRect === rect.id && currentTool === "select" &&
                                // 对于头像区域，限制右下角调节
                                (rect.type === RectangleType.Avatar
                                    ? handleConfigs.filter((h) => h.handle === "bottom-right")
                                    : handleConfigs
                                ).map((item) => (
                                  <div
                                    key={item.handle}
                                    className="absolute bg-primary border border-white shadow-xs"
                                    style={{
                                      ...item.style,
                                      width: handleSize,
                                      height: handleSize,
                                      cursor: item.cursor,
                                      // 确保在顶层显示（高于内部内容与边框）
                                      zIndex: 100,
                                    }}
                                    onMouseDown={(e) => handleResizeStart(e, rect.id, item.handle)}
                                    onTouchStart={(e) => handleResizeStart(e, rect.id, item.handle)}
                                  />
                                ))}
                            </div>
                          );
                        })}

                        {/* Current drawing rectangle */}
                        {currentRect &&
                          (() => {
                            const {scaleX, scaleY} = getImageScale();
                            return (
                              <div
                                className="absolute border-2 border-red-400 bg-red-500/10 select-none"
                                style={{
                                  left: currentRect.x / scaleX,
                                  top: currentRect.y / scaleY,
                                  width: currentRect.width / scaleX,
                                  height: currentRect.height / scaleY,
                                }}
                              />
                            );
                          })()}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      {contextTargetId ? (
                        <>
                          <ContextMenuItem onSelect={() => duplicateRectangle(contextTargetId!)}>
                            <Copy className="w-4 h-4 mr-2"/> {tc("duplicate")}
                          </ContextMenuItem>
                          <ContextMenuItem className="text-destructive"
                                           onSelect={() => deleteRectangle(contextTargetId!)}>
                            <Trash className="w-4 h-4 mr-2"/> {tc("delete")}
                          </ContextMenuItem>
                        </>
                      ) : (
                        <>
                          <ContextMenuItem onSelect={() => setCurrentTool("create")}>
                            <Square className="w-4 h-4 mr-2"/> {t("tools.create")}
                          </ContextMenuItem>
                          <ContextMenuSeparator/>
                          <ContextMenuItem>
                            <X className="w-4 h-4 mr-2"/> {tc("cancel")}
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ) : (
                  <div
                    className="relative h-full flex items-center justify-center border-2 border-dashed hover:border-primary rounded-lg animate-simple"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia>
                          <FolderOpen className="w-12 h-12 text-muted-foreground"/>
                        </EmptyMedia>
                        <EmptyTitle className="text-muted-foreground">{t("placeholder.noImage.title")}</EmptyTitle>
                        <EmptyDescription
                          className="text-muted-foreground">{t("placeholder.noImage.description")}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>

                    {/* 拖放状态显示 */}
                    {isDraggingOver && (
                      <DragAndDropOverlay
                        isRounded={!uploadedImage}
                        rejectReason={rejectReason}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Setting Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex-title text-xl font-semibold">
                <Settings/>
                <span>{tc("section.settings")}</span>
              </h2>

              {/* Import and export */}
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!uploadedImage}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4"/>
                  {tc("export")}
                </Button>
                <Button
                  onClick={() => setImportDialogOpen(true)}
                  disabled={!uploadedImage}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4"/>
                  {tc("import")}
                </Button>
              </div>
            </div>

            {/* Image Properties */}
            {uploadedImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="items-center space-y-3">
                    <h3 className="font-medium">{t("imgAttrs.title")}</h3>
                    <div>
                      <Label htmlFor="imageUrl">{t("imgAttrs.imgLink")}</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={imagePath ?? ""}
                        onChange={(e) => setImagePath(e.target.value)}
                        onBlur={(e) => {
                          setImagePath(e.target.value.trim() || undefined);
                        }}
                        placeholder={common.urlPlaceholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mapName">{t("imgAttrs.mapName")}</Label>
                      <Input
                        id="mapName"
                        value={mapName ?? ""}
                        onChange={(e) => setMapName(e.target.value)}
                        onBlur={(e) => {
                          setMapName(e.target.value.trim() || undefined);
                        }}
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
                    <h3 className="font-medium">{t("rectAttrs.listTitle")}</h3>
                  </div>

                  {rectangles.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MousePointerClick/>
                        </EmptyMedia>
                        <EmptyTitle>{t("placeholder.noRectangle.title")}</EmptyTitle>
                        <EmptyDescription>{t("placeholder.noRectangle.description")}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="space-y-2" ref={rectListRef}>
                      {rectangles.map((rect, index) => (
                        <div
                          key={rect.id}
                          className={cn(
                            "flex w-full min-w-0 px-3 py-2 rounded-md border items-center justify-between gap-3  transition-colors",
                            selectedRect === rect.id ? "border-primary bg-primary/15" : "border-border bg-card",
                            draggingRectId === rect.id ? "opacity-70" : "hover:bg-primary/5",
                          )}
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
                          <div className="flex w-full items-center gap-2 min-w-0">
                            <div
                              className="h-full text-muted-foreground hover:text-foreground cursor-grab shrink-0 -ml-3 pl-3 py-2 rounded-md"
                              onDragStart={(e) => handleDragStartRow(e, rect.id)}
                              onDragEnd={handleDragEndRow}
                              draggable
                              aria-label={t("rectAttrs.dragPrompt")}
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
                            {rect.type === RectangleType.Avatar ? <CircleUserRound/> : <Square/>}

                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`text-sm font-medium text-left truncate ${rect.alt || "italic"}`}>
                                {rect.alt || t("rectAttrs.defaultName", {index: index + 1})}
                              </span>
                              <span
                                className={`text-xs text-muted-foreground text-left truncate ${rect.href || "italic"}`}
                              >
                                {rect.href || t("rectAttrs.unsetLink")}
                              </span>
                            </div>

                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
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
                                <Copy className="w-4 h-4 shrink-0"/>
                                <span className="truncate">{tc("duplicate")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  deleteRectangle(rect.id);
                                }}
                              >
                                <Trash className="w-4 h-4 shrink-0"/>
                                <span className="truncate">{tc("delete")}</span>
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
                    <h3 className="font-medium">{t("rectAttrs.title")}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateRectangle(selectedRect)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4"/>
                        {tc("duplicate")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteRectangle(selectedRect)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4"/>
                        {tc("delete")}
                      </Button>
                    </div>
                  </div>
                  {selectedRectData && (
                    <div className="space-y-2">
                      {/* 区域类型选择 */}
                      <div className="space-y-1">
                        <Label htmlFor="rectType">{t("rectAttrs.rectType")}</Label>
                        <Select
                          value={selectedRectData.type}
                          onValueChange={(e) => updateRectangleType(selectedRect, e as RectangleType)}
                        >
                          <SelectTrigger id="rectType">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="mapArea"
                                        value={RectangleType.MapArea}>{t("rectAttrs.types.mapArea")}</SelectItem>
                            <SelectItem key="avatar"
                                        value={RectangleType.Avatar}>{t("rectAttrs.types.avatar")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Avatar 类型的专用属性 */}
                      {selectedRectData.type === RectangleType.Avatar && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor="avatarStyle">{ta("settings.avatarStyle")}</Label>
                            <Select
                              value={selectedRectData.avatar?.styleKey ?? "simple"}
                              onValueChange={(e) => updateAvatarField(selectedRect, "styleKey", e)}
                            >
                              <SelectTrigger id="avatarStyle">
                                <SelectValue/>
                              </SelectTrigger>
                              <SelectContent>
                                {STYLE_REGISTRY.map(({key, style}) => (
                                  <SelectItem key={key} value={key}>{ta(`styles.${style.key}.name`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="avatarLink">{ta("settings.avatarLink")}</Label>
                            <Input
                              id="avatarLink"
                              placeholder={`https://a.ppy.sh/${ta("settings.userIdPlaceholder")}`}
                              value={selectedRectData.avatar?.imageUrl ?? ""}
                              onChange={(e) => updateAvatarField(selectedRect, "imageUrl", e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="user">{ta("settings.username")}</Label>
                              <Input
                                id="user"
                                placeholder="peppy"
                                value={selectedRectData.avatar?.username ?? ""}
                                onChange={(e) => updateAvatarField(selectedRect, "username", e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="countryCode">{ta("settings.countryCode")}</Label>
                              <Input
                                id="countryCode"
                                placeholder={ta("settings.countryCodeDescription")}
                                value={selectedRectData.avatar?.countryCode ?? ""}
                                onChange={(e) => updateAvatarField(selectedRect, "countryCode", e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor="link">{t("rectAttrs.link")}</Label>
                        <Input
                          id="link"
                          type="url"
                          value={selectedRectData.href || ""}
                          onChange={(e) => updateRectangle(selectedRect, "href", e.target.value)}
                          placeholder={common.urlPlaceholder}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="altText">{t("rectAttrs.alt")}</Label>
                        <Input
                          id="altText"
                          type="text"
                          value={selectedRectData.alt || ""}
                          onChange={(e) => updateRectangle(selectedRect, "alt", e.target.value)}
                          placeholder={t("rectAttrs.altDescription")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="userInfo">{t("rectAttrs.userInfo")}</Label>
                        <InputGroup className="overflow-visible">
                          <InputGroupInput
                            id="userInfo"
                            value={userInfo}
                            onChange={(e) => setUserInfo(e.target.value)}
                            onBlur={(e) => setUserInfo(e.target.value.trim())}
                          />
                          <InputGroupAddon align="inline-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InputGroupButton
                                  disabled={userInfo.trim().length === 0 || Number.isNaN(Number(userInfo))}
                                  onClick={() =>
                                    updateRectangle(selectedRect, "href", generateUserLinkFromId(Number(userInfo)))
                                  }
                                >
                                  <Hash className="w-4 h-4"/>
                                </InputGroupButton>
                              </TooltipTrigger>
                              <TooltipContent>{t("rectAttrs.fillAsId")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InputGroupButton
                                  disabled={userInfo.trim().length === 0}
                                  onClick={() => updateRectangle(selectedRect, "href", generateUserLinkFromName(userInfo))}
                                >
                                  <UserRound className="w-4 h-4"/>
                                </InputGroupButton>
                              </TooltipTrigger>
                              <TooltipContent>{t("rectAttrs.fillAsUsername")}</TooltipContent>
                            </Tooltip>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="posX">{t("rectAttrs.x")}</Label>
                          <Input
                            id="posX"
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
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="posY">{t("rectAttrs.y")}</Label>
                          <Input
                            id="posY"
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
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="width">{t("rectAttrs.width")}</Label>
                          <Input
                            id="width"
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
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="height">{t("rectAttrs.height")}</Label>
                          <Input
                            id="height"
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
            <div className="flex items-center justify-between">
              <h2 className="flex-title text-xl font-semibold">
                <Code/>
                <span>{tc("section.generatedCode")}</span>
              </h2>
            </div>

            {/* Generated Code */}
            <Card className="flex-1">
              {uploadedImage && rectangles.length !== 0 ?
                (<>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">HTML 代码</h3>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(generateImageMapHtml(rectangles, imagePath ?? imageName, mapName))
                            .then(() => toast({
                                title: tc("copySuccess"),
                              }),
                            );
                        }}
                        size="sm"
                      >
                        <Copy className="w-4 h-4"/>
                        {tc("copy")}
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                    <pre>
                    <code
                      dangerouslySetInnerHTML={{
                        __html: hljs.highlight(generateImageMapHtml(rectangles, imagePath ?? imageName, mapName),
                          {language: "html"}).value,
                      }}/>
                    </pre>
                    </div>
                  </CardContent>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">BBCode 代码</h3>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(generateImageMapBBCode(rectangles, imageSize.width, imageSize.height, imagePath ?? imageName))
                            .then(() => toast({
                                title: tc("copySuccess"),
                              }),
                            );
                        }}
                        size="sm"
                      >
                        <Copy className="w-4 h-4"/>
                        {tc("copy")}
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                      <pre>
                        <code
                          dangerouslySetInnerHTML={{
                            __html: hljs.highlight(generateImageMapBBCode(rectangles, imageSize.width, imageSize.height, imagePath ?? imageName),
                              {language: "bbcode"}).value,
                          }}/>
                      </pre>
                    </div>
                  </CardContent>
                </>)
                : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Code/>
                      </EmptyMedia>
                      <EmptyTitle>{t("placeholder.noCode.title")}</EmptyTitle>
                      <EmptyDescription>{t("placeholder.noCode.description")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )
              }
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
                  loadImageFile(pendingFile).then(_ => {
                  });
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

      {/* 导出对话框 */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} data={generateExportData()}/>

      {/* 导入对话框 */}
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportData}
                    imageWidth={imageSize.width} imageHeight={imageSize.height}/>
    </div>
  );
}
