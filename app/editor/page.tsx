"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Copy,
  Hash,
  MousePointer,
  Move,
  OctagonAlert,
  Square,
  Trash,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { clamp } from "@/lib/utils";
import DragAndDropOverlay, { DnDRejectReason } from "@/app/editor/dnd-overlay";
import { common } from "@/app/common";
import hljs from "highlight.js/lib/core";
import html from "highlight.js/lib/languages/xml";

interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  alt: string;
}

interface ContextMenuPosition {
  x: number;
  y: number;
  visible: boolean;
  targetId: string | null;
}

type EditorTool = "select" | "move" | "create" | "delete"

const tool_names = {
  "select": "选择",
  "move": "移动",
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

  // Rectangle and drawing states
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({x: 0, y: 0});
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [selectedRect, setSelectedRectId] = useState<string | null>(null);
  const [movingRect, setMovingRect] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({x: 0, y: 0});
  const [lastPositionInput, setLastPositionInput] = useState({x: "0", y: "0"});
  const [lastSizeInput, setLastSizeInput] = useState({width: "50", height: "50"});

  const [isTouchDevice, setIsTouchDevice] = useState(false);

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

  // 注册 hljs 语言
  hljs.registerLanguage("html", html);
  registerBBCodeHighlight();

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
          setSelectedRect(clickedRect.id);
        } else {
          setSelectedRect(null);
        }
        break;

      case "move":
        // 检查是否点击在矩形上以开始移动
        const rectToMove = rectangles.find(
          (rect) =>
            coords.x >= rect.x &&
            coords.x <= rect.x + rect.width &&
            coords.y >= rect.y &&
            coords.y <= rect.y + rect.height,
        );

        if (rectToMove) {
          setMovingRect(rectToMove.id);
          setMoveOffset({
            x: coords.x - rectToMove.x,
            y: coords.y - rectToMove.y,
          });
          setSelectedRect(rectToMove.id);
        }
        break;

      case "create":
        setSelectedRect(null);

        if (coords.x <= imageSize.width && coords.y <= imageSize.height) {
          setIsDrawing(true);
          setStartPoint(coords);
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

    // 根据当前工具执行不同操作
    if (isDrawing && currentTool === "create") {
      // 创建新矩形
      const width = coords.x - startPoint.x;
      const height = coords.y - startPoint.y;

      const rect: Rectangle = {
        id: "temp",
        x: Math.min(startPoint.x, coords.x),
        y: Math.min(startPoint.y, coords.y),
        width: Math.abs(width),
        height: Math.abs(height),
        href: "#",
        alt: `区域 ${rectangles.length + 1}`,
      };

      setCurrentRect(rect);
    } else if (movingRect && currentTool === "move") {
      // 移动现有矩形
      setRectangles((prev) =>
        prev.map((rect) => {
          if (rect.id === movingRect) {
            return {
              ...rect,
              x: clamp(coords.x - moveOffset.x, 0, imageSize.width - rect.width),
              y: clamp(coords.y - moveOffset.y, 0, imageSize.height - rect.height),
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

  const generateImageMapHtml = () => {
    if (!uploadedImage || rectangles.length === 0) return "<!-- 上传图片并创建区域后，HTML 代码将在这里显示 -->";

    const mapName = "imagemap";
    const areas = rectangles
      .map(
        (rect) =>
          `  <area shape="rect" coords="${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.x + rect.width)},${Math.round(rect.y + rect.height)}" href="${rect.href}" alt="${rect.alt}">`,
      )
      .join("\n");

    return `<img src="${imageName ?? "your-image.jpg"}" alt="Collab Image" usemap="#${mapName}">
<map name="${mapName}">
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
          + ` ${rect.href} ${rect.alt}`,
      )
      .join("\n");

    return `[imagemap]\n图像链接\n${areas}\n[/imagemap]`;
  };

  // 获取工具按钮的样式
  const getToolButtonClass = (tool: EditorTool) => {
    return `p-2 rounded-md ${
      currentTool === tool ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-foreground/10"
    }`;
  };

  // 获取鼠标样式
  const getCursorStyle = () => {
    switch (currentTool) {
      case "move":
        return "cursor-move";
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">ImageMap </span>
            编辑器
          </h1>
          <p className="text-secondary-foreground">划定可点击区域，以便在个人资料等中使用</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Preview Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">预览区</h2>
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
                  title="选择工具"
                >
                  <MousePointer className="w-5 h-5"/>
                </button>
                <button className={getToolButtonClass("move")} onClick={() => setCurrentTool("move")}
                        title="移动工具">
                  <Move className="w-5 h-5"/>
                </button>
                <button
                  className={getToolButtonClass("create")}
                  onClick={() => setCurrentTool("create")}
                  title="创建工具"
                >
                  <Square className="w-5 h-5"/>
                </button>
                <button
                  className={getToolButtonClass("delete")}
                  onClick={() => setCurrentTool("delete")}
                  title="删除工具"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>
                <div className="border-l border-muted-foreground mx-1"></div>
                <div className="text-sm text-muted-foreground flex items-center px-2">
                  当前工具: {tool_names[currentTool]}
                </div>
              </div>
            )}

            <Card className="h-96 lg:h-[500px]">
              <CardContent className="p-4 h-full">
                {uploadedImage ? (
                  <div
                    ref={containerRef}
                    className={`relative h-full border-2 border-dashed border-muted-foreground rounded-lg overflow-hidden touch-none select-none
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
                    style={{touchAction: "none", userSelect: "none"}}
                  >
                    <img
                      ref={imageRef}
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded"
                      className="max-w-full max-h-full object-contain select-none"
                      draggable={false}
                      style={{userSelect: "none"}}
                    />

                    {/* 拖放状态显示 */}
                    {isDraggingOver && <DragAndDropOverlay isDragAccepted={isDragAccept}
                                                           rejectReason={rejectReason}/>}

                    {/* Existing rectangles */}
                    {/* 显示时将原图像坐标缩放到预览区 */}
                    {rectangles.map((rect) => {
                      const {scaleX, scaleY} = getImageScale();
                      // 十字光标较为特殊（画框），在此处先处理
                      return (
                        <div
                          key={rect.id}
                          className={`absolute border-2 bg-primary/20 select-none touch-manipulation ${
                            selectedRect === rect.id ? "border-primary border-4" : "border-primary/40"
                          } ${isTouchDevice ? "min-w-[44px] min-h-[44px]" : ""} ${getCursorStyle()}`}
                          style={{
                            left: rect.x / scaleX,
                            top: rect.y / scaleY,
                            width: Math.max(rect.width / scaleX, isTouchDevice ? 44 : rect.width / scaleX),
                            height: Math.max(rect.height / scaleY, isTouchDevice ? 44 : rect.height / scaleY),
                            cursor: currentTool === "move" ? "move" : currentTool === "delete" ? "no-drop" : "pointer",
                            userSelect: "none",
                          }}
                        >
                          <div
                            className={`absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1 rounded select-none ${
                              isTouchDevice ? "text-sm px-2 py-1" : ""
                            }`}
                          >
                            {rect.alt}
                          </div>
                          {selectedRect === rect.id && (
                            <div
                              className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
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
                    {isDraggingOver && <DragAndDropOverlay isDragAccepted={isDragAccept}
                                                           rejectReason={rejectReason}/>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Code Area */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">代码区</h2>

            {/* Rectangle Properties */}
            {selectedRect && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">编辑区域属性</h3>
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
                  {rectangles.find((r) => r.id === selectedRect) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">链接地址</label>
                        <input
                          type="url"
                          value={rectangles.find((r) => r.id === selectedRect)?.href || ""}
                          onChange={(e) => updateRectangle(selectedRect, "href", e.target.value)}
                          className={`w-full px-3 py-2 border hover:border-primary rounded-md text-sm ${
                            isTouchDevice ? "py-3 text-base" : ""
                          }`}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">替代文本</label>
                        <input
                          type="text"
                          value={rectangles.find((r) => r.id === selectedRect)?.alt || ""}
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
                            作为 ID 填入
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
                            作为用户名填入
                          </Button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">X 坐标</label>
                          <input
                            type="number"
                            value={lastPositionInput.x}
                            onChange={(e) => {
                              if (!e.target.value)
                                return;

                              setLastPositionInput({
                                ...lastPositionInput,
                                x: e.target.value,
                              });
                              updateRectangle(selectedRect, "x", e.target.value, true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Y 坐标</label>
                          <input
                            type="number"
                            value={lastPositionInput.y}
                            onChange={(e) => {
                              if (!e.target.value)
                                return;

                              setLastPositionInput({
                                ...lastPositionInput,
                                y: e.target.value,
                              });
                              updateRectangle(selectedRect, "y", e.target.value, true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">宽度</label>
                          <input
                            type="number"
                            value={lastSizeInput.width}
                            onChange={(e) => {
                              if (!e.target.value)
                                return;

                              setLastSizeInput({...lastSizeInput, width: e.target.value});
                              updateRectangle(selectedRect, "width", e.target.value, true);
                            }}
                            className="w-full px-3 py-2 border hover:border-primary rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">高度</label>
                          <input
                            type="number"
                            value={lastSizeInput.height}
                            onChange={(e) => {
                              if (!e.target.value)
                                return;

                              setLastSizeInput({...lastSizeInput, height: e.target.value});
                              updateRectangle(selectedRect, "height", e.target.value, true);
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
