"use client";

import type { AvatarInputs } from "@/app/avatar/styles/IAvatarStyle";
import { HelpIconButton } from "@/components/help-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import SaveDialog from "@/components/imagemap/save-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type AvatarComponentCache, resolveCachedAvatarComponent } from "@/lib/avatar/render-cache";
import { AVATAR_STYLE_REGISTRY, type AvatarStyleKey } from "@/lib/avatar/style-registry";
import { exportElementSnapshotDataUrl } from "@/lib/export/snapdom";
import {
  cn,
  debounce,
  generateId,
  generateImageMapBBCode,
  generateImageMapHtml,
  getProxiedImageUrl,
  isNullOrWhitespace,
} from "@/lib/utils";
import {
    Camera,
  Copy,
  Eye,
  Grid3X3,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Palette,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BackgroundConfig, GridLayout, GridUser, ImageMapArea } from "./types";

const DEFAULT_LAYOUT: GridLayout = {
  columns: 4,
  gap: 16,
  padding: 24,
};

const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: "color",
  color: "#f8fafc",
};

const DEFAULT_EXPORT_SCALE = 2;

const generateSampleUsers = (): GridUser[] => {
  const sampleNames = ["peppy", "Cookiezi", "Vaxei", "mrekk", "WhiteCat", "Mathi", "RyuK", "Aristia"];
  return sampleNames.map((name, index) => ({
    id: generateId(),
    userId: String(1000 + index),
    username: name,
    avatarUrl: `https://a.ppy.sh/${1000 + index}`,
    countryCode: ["US", "JP", "KR", "DE", "FR", "GB", "CA", "AU"][index],
  }));
};

export default function AvatarGridPage() {
  const t = useTranslations("avatargrid");
  const ta = useTranslations("avatar");
  const tc = useTranslations("common");
  const { toast } = useToast();

  const [users, setUsers] = useState<GridUser[]>([]);
  const [layout, setLayout] = useState<GridLayout>(DEFAULT_LAYOUT);
  const [draftLayout, setDraftLayout] = useState<GridLayout>(DEFAULT_LAYOUT);
  const [background, setBackground] = useState<BackgroundConfig>(DEFAULT_BACKGROUND);
  const [showUsernames, setShowUsernames] = useState(true);
  const [showFlags, setShowFlags] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [styleKey, setStyleKey] = useState<AvatarStyleKey>(AVATAR_STYLE_REGISTRY[0].key);

  const [bulkInput, setBulkInput] = useState("");
  const [hasPendingUpdate] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // 创建防抖的 setState 函数
  const debouncedSetState = useMemo(() => {
    return {
      setBackground: debounce((background: BackgroundConfig) => {
        setBackground(background);
      }, 100),
    };
  }, []);

  useEffect(() => {
    setDraftLayout(layout);
  }, [layout]);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarCacheRef = useRef<AvatarComponentCache>(new Map());

  const selectedStyle = useMemo(() => AVATAR_STYLE_REGISTRY.find((s) => s.key === styleKey)?.style, [styleKey]);
  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);

  const [editUserId, setEditUserId] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editCountryCode, setEditCountryCode] = useState("");
  const [editCustomLink, setEditCustomLink] = useState("");

  useEffect(() => {
    if (selectedUser) {
      setEditUserId(selectedUser.userId || "");
      setEditUsername(selectedUser.username);
      setEditCountryCode(selectedUser.countryCode || "");
      setEditCustomLink(selectedUser.customLink || "");
    } else {
      setEditUserId("");
      setEditUsername("");
      setEditCountryCode("");
      setEditCustomLink("");
    }
  }, [selectedUser]);

  useEffect(() => {
    const updateDevicePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    updateDevicePixelRatio();
    window.addEventListener("resize", updateDevicePixelRatio);

    return () => {
      window.removeEventListener("resize", updateDevicePixelRatio);
    };
  }, []);

  const gridCells = useMemo(() => {
    const cells: { user?: GridUser; id: string; col: number; row: number }[] = [];
    const effectiveRows = Math.ceil(users.length / layout.columns);

    for (let i = 0; i < users.length; i++) {
      const col = i % layout.columns;
      const row = Math.floor(i / layout.columns);
      cells.push({ user: users[i], id: `${i}-${users[i]?.id || i}`, col, row });
    }

    return { cells, effectiveRows };
  }, [users, layout.columns]);

  // 头像尺寸测量逻辑
  const [avatarSize, setAvatarSize] = useState({ width: 100, height: 100 });
  const sizeMeasurementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 测量第一个头像的实际尺寸
    if (!selectedStyle) return;

    if (sizeMeasurementRef.current && users.length > 0) {
      const rect = sizeMeasurementRef.current.getBoundingClientRect();
      const previewScale = isExporting ? 1 : devicePixelRatio > 0 ? 1 / devicePixelRatio : 1;
      const normalizedScale = previewScale > 0 ? previewScale : 1;
      const width = rect.width / normalizedScale;
      const height = rect.height / normalizedScale;
      if (width > 0 && height > 0) {
        setAvatarSize({ width, height });
      }
    }
  }, [users, selectedStyle, isExporting, devicePixelRatio]);

  // 更新预览尺寸计算，使用实际测量的头像尺寸
  const previewDimensions = useMemo(() => {
    const { effectiveRows } = gridCells;
    const cols = layout.columns;
    const totalGapX = (cols - 1) * layout.gap;
    const totalGapY = (effectiveRows - 1) * layout.gap;

    const width = cols * avatarSize.width + totalGapX + layout.padding * 2;
    const height = effectiveRows * (avatarSize.height + (showUsernames ? 24 : 0)) + totalGapY + layout.padding * 2;

    return { width, height };
  }, [gridCells, layout.columns, layout.gap, layout.padding, showUsernames, avatarSize]);

  // 更新图像映射区域计算，使用实际测量的头像尺寸
  const imageMapAreas = useMemo((): ImageMapArea[] => {
    return gridCells.cells.map((cell, index) => {
      const x = layout.padding + cell.col * (avatarSize.width + layout.gap);
      const y = layout.padding + cell.row * (avatarSize.height + layout.gap + (showUsernames ? 24 : 0));

      return {
        id: cell.user?.id || `area-${index}`,
        x,
        y,
        width: avatarSize.width,
        height: avatarSize.height,
        href: cell.user?.customLink || (cell.user?.userId ? `https://osu.ppy.sh/users/${cell.user.userId}` : "#"),
        alt: cell.user?.username || "",
      };
    });
  }, [gridCells, layout.padding, layout.gap, showUsernames, avatarSize]);

  const previewScale = useMemo(() => {
    return devicePixelRatio > 0 ? 1 / devicePixelRatio : 1;
  }, [devicePixelRatio]);

  const effectivePreviewScale = useMemo(() => {
    return isExporting ? 1 : previewScale;
  }, [isExporting, previewScale]);

  // User management functions
  const addNewUser = useCallback(() => {
    const newId = generateId();
    const newUser: GridUser = {
      id: newId,
      userId: "",
      username: t("fields.newUser"),
      avatarUrl: "",
      countryCode: undefined,
    };
    setUsers([...users, newUser]);
    setSelectedUserId(newId);
  }, [t, users]);

  const addBulkUsers = () => {
    if (!bulkInput.trim()) {
      toast({
        title: t("validation.emptyInput"),
        variant: "destructive",
      });
      return;
    }

    const lines = bulkInput.split(/\n/).filter((line) => line.trim());
    const newUsers: GridUser[] = [];

    for (const line of lines) {
      const parts = line.split(/[,\s]+/).filter((p) => p.trim());
      if (parts.length >= 1) {
        const username = parts[0];
        const userId = parts[1] || "";
        const countryCode = parts[2] || undefined;

        newUsers.push({
          id: generateId(),
          userId,
          username,
          avatarUrl: userId ? `https://a.ppy.sh/${userId}` : "",
          countryCode,
        });
      }
    }

    if (newUsers.length > 0) {
      setUsers([...users, ...newUsers]);
      setBulkInput("");
      toast({
        title: t("users.added", { count: newUsers.length }),
      });
    } else {
      toast({
        title: t("validation.noValidUsers"),
        description: t("validation.checkInputFormat"),
        variant: "destructive",
      });
    }
  };

  const duplicateUser = useCallback(
    (id: string) => {
      const userToDuplicate = users.find((u) => u.id === id);
      if (userToDuplicate) {
        const newUser: GridUser = {
          ...userToDuplicate,
          id: generateId(),
          username: `${userToDuplicate.username} ${tc("duplicateSuffix")}`,
        };
        setUsers([...users, newUser]);
      }
    },
    [users, tc],
  );

  const removeUser = useCallback(
    (id: string) => {
      setUsers(users.filter((u) => u.id !== id));
      if (selectedUserId === id) {
        setSelectedUserId(null);
      }
      avatarCacheRef.current.delete(id);
    },
    [users, selectedUserId],
  );

  const clearAllUsers = useCallback(() => {
    setUsers([]);
    setSelectedUserId(null);
    avatarCacheRef.current.clear();
  }, []);

  const loadSampleData = useCallback(() => {
    setUsers(generateSampleUsers());
    setSelectedUserId(null);
    avatarCacheRef.current.clear();
  }, []);

  const handleBackgroundImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // 验证文件类型
        if (!file.type.startsWith("image/")) {
          toast({
            title: t("validation.invalidImage"),
            description: t("validation.imageOnly"),
            variant: "destructive",
          });
          return;
        }

        // 验证文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: t("validation.imageTooLarge"),
            description: t("validation.imageSizeLimit"),
            variant: "destructive",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          setBackground({
            ...background,
            type: "image",
            imageUrl: e.target?.result as string,
          });
          toast({
            title: t("background.uploaded"),
            description: t("background.uploadedDescription"),
          });
        };
        reader.onerror = () => {
          toast({
            title: t("background.uploadError"),
            description: t("background.uploadErrorDescription"),
            variant: "destructive",
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [background, t, toast],
  );

  const handleExportImage = useCallback(async (options: { format: string; quality: number }): Promise<string | null> => {
    if (!previewRef.current) {
      throw new Error(t("export.previewNotFound"));
    }

    if (users.length === 0) {
      throw new Error(t("export.noUsers"));
    }

    setIsExporting(true);

    try {
      return await exportElementSnapshotDataUrl(previewRef.current, {
        format: options.format,
        quality: options.quality,
        waitFrames: 2,
        exportOptions: {
          scale: DEFAULT_EXPORT_SCALE,
        },
      });
    } finally {
      setIsExporting(false);
    }
  }, [t, users]);

  const imageMapHtml = useMemo(
    () => generateImageMapHtml(imageMapAreas, "your-image.png", "avatargrid"),
    [imageMapAreas],
  );

  const imageMapBBCode = useMemo(
    () => generateImageMapBBCode(imageMapAreas, previewDimensions.width, previewDimensions.height, "your-image.png"),
    [imageMapAreas, previewDimensions.height, previewDimensions.width],
  );

  const getBackgroundStyle = useCallback((): React.CSSProperties => {
    switch (background.type) {
      case "color":
        return { backgroundColor: background.color };
      case "image":
        return {
          backgroundImage: background.imageUrl ? `url(${background.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      case "gradient": {
        const directionMap = {
          "to-right": "to right",
          "to-bottom": "to bottom",
          "to-bottom-right": "to bottom right",
          "to-bottom-left": "to bottom left",
        };
        return {
          backgroundImage: `linear-gradient(${directionMap[background.gradientDirection || "to-bottom"]}, ${background.gradientFrom || "#f8fafc"}, ${background.gradientTo || "#e2e8f0"})`,
        };
      }
      default:
        return {};
    }
  }, [background]);

  const resolveAvatar = (user: GridUser): React.FC | null => {
    if (!user || isNullOrWhitespace(user.avatarUrl) || isNullOrWhitespace(user.username)) {
      return null;
    }

    const inputs: AvatarInputs = {
      imageUrl: user.avatarUrl,
      username: user.username,
      countryCode: user.countryCode?.trim() ? user.countryCode.trim().toUpperCase() : undefined,
    };
    const resolved = resolveCachedAvatarComponent(
      user.id,
      {
        styleKey,
        imageUrl: inputs.imageUrl,
        username: inputs.username,
        countryCode: inputs.countryCode,
      },
      AVATAR_STYLE_REGISTRY,
      avatarCacheRef.current,
    );

    if (!resolved) {
      if (selectedStyle) {
        console.error("Failed to generate avatar:", user.id);
      }
      return null;
    }

    return resolved.component;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="flex-title text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">{t("title")}</span>
            <HelpIconButton section="avatargrid" />
          </h1>
          <p className="text-secondary-foreground">{t("description")}</p>
        </div>

        {/* Preview Panel - Top Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex-title gap-2">
              <Eye />
              {tc("section.preview")}
            </CardTitle>
            <CardAction>
              {users.length > 0 && (
                <Button onClick={() => setSaveDialogOpen(true)} size="sm" className="gap-2">
                  <Camera className="w-4 h-4" />
                  {tc("save")}
                </Button>
              )}
            </CardAction>
            <CardDescription>
              {Math.round(previewDimensions.width)} × {Math.round(previewDimensions.height)}px
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div
                ref={previewRef}
                className={cn("inline-block transition-opacity", hasPendingUpdate && "opacity-50")}
                style={{
                  ...getBackgroundStyle(),
                  padding: layout.padding,
                  zoom: effectivePreviewScale,
                  borderRadius: 8,
                  maxWidth: "100%",
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${layout.columns}, max-content)`,
                    gap: layout.gap,
                    alignItems: "start",
                    justifyContent: "start",
                    width: "max-content",
                  }}
                >
                  {gridCells.cells.map((cell) => {
                    const AvatarComponent = cell.user ? resolveAvatar(cell.user) : null;

                    return (
                      <div key={cell.id} className="flex flex-col items-center gap-1 w-fit">
                        {cell.user ? (
                          <div className="w-fit h-fit">
                            <div ref={cell.col === 0 && cell.row === 0 ? sizeMeasurementRef : null}>
                              {AvatarComponent ? (
                                <AvatarComponent />
                              ) : (
                                <div
                                  style={{
                                    backgroundColor: "#f1f5f9",
                                    padding: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <div className="text-xs text-muted-foreground">No avatar</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              backgroundColor: "#f1f5f9",
                              width: "fit-content",
                              height: "fit-content",
                              minWidth: avatarSize.width,
                              minHeight: avatarSize.height,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div className="text-xs text-muted-foreground">No user</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Grid3X3 />
                  </EmptyMedia>
                  <EmptyTitle>{t("empty.title")}</EmptyTitle>
                  <EmptyDescription>{t("empty.description")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {/* Imagemap Output - Top Section */}
        {users.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex-title gap-2">
                <LinkIcon />
                {t("sections.imagemap")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="bbcode">BBCode</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-50">
                    <code>{imageMapHtml}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="bbcode">
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-50">
                    <code>{imageMapBBCode}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Remaining Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex-title gap-2">
                  <Users />
                  {t("sections.users")}
                </CardTitle>
                <CardAction>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadSampleData}>
                      {t("actions.loadSample")}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={clearAllUsers} disabled={users.length === 0}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add User & Bulk Import */}
                <div className="flex gap-2">
                  <Button onClick={addNewUser} size="sm" className="gap-2 flex-1">
                    <UserPlus className="w-4 h-4" />
                    {t("actions.addUser")}
                  </Button>
                </div>

                <Tabs defaultValue="table">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table">{t("tabs.table")}</TabsTrigger>
                    <TabsTrigger value="bulk">{t("tabs.bulk")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" className="space-y-3">
                    {users.length > 0 ? (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8 px-2 pr-0">#</TableHead>
                              <TableHead className="w-24">{t("table.userId")}</TableHead>
                              <TableHead>{t("table.username")}</TableHead>
                              <TableHead className="w-24 text-right">{t("table.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <React.Fragment key={user.id}>
                                <TableRow
                                  className={cn("cursor-pointer")}
                                  onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)}
                                >
                                  <TableCell className="pl-2 pr-0">
                                    <img
                                      src={getProxiedImageUrl(user.avatarUrl) || "/placeholder.svg"}
                                      alt={user.username}
                                      className="w-5 h-5 rounded-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono">{user.userId || "-"}</TableCell>
                                  <TableCell>
                                    <span className="truncate">{user.username}</span>
                                    {user.countryCode && (
                                      <span className="text-xs text-muted-foreground">[{user.countryCode}]</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          duplicateUser(user.id);
                                        }}
                                        aria-label={tc("duplicate")}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeUser(user.id);
                                        }}
                                        aria-label={t("actions.removeUser", { username: user.username })}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {selectedUserId === user.id && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="p-4 bg-muted/50">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <img
                                              src={getProxiedImageUrl(user.avatarUrl) || "/placeholder.svg"}
                                              alt={user.username}
                                              className="w-8 h-8 rounded-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                                              }}
                                            />
                                            <span className="text-sm font-medium">{t("fields.editingUser")}</span>
                                          </div>
                                          <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)}>
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs">{t("fields.userId")}</Label>
                                            <Input
                                              value={editUserId}
                                              onChange={(e) => setEditUserId(e.target.value)}
                                              placeholder="2"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">{t("fields.username")}</Label>
                                            <Input
                                              value={editUsername}
                                              onChange={(e) => setEditUsername(e.target.value)}
                                              placeholder="peppy"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs">{t("fields.countryCode")}</Label>
                                            <Input
                                              value={editCountryCode}
                                              onChange={(e) => setEditCountryCode(e.target.value)}
                                              placeholder="US"
                                              maxLength={2}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">{t("fields.customLink")}</Label>
                                            <Input
                                              value={editCustomLink}
                                              onChange={(e) => setEditCustomLink(e.target.value)}
                                              placeholder="https://..."
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                                            {tc("cancel")}
                                          </Button>
                                          <Button
                                            onClick={() => {
                                              // 直接更新用户信息，不使用防抖
                                              setUsers((prev) =>
                                                prev.map((u) =>
                                                  u.id === user.id
                                                    ? {
                                                        ...u,
                                                        userId: editUserId.trim(),
                                                        username: editUsername.trim(),
                                                        countryCode: editCountryCode.trim().toUpperCase() || undefined,
                                                        customLink: editCustomLink.trim() || undefined,
                                                        avatarUrl: editUserId.trim()
                                                          ? `https://a.ppy.sh/${editUserId.trim()}`
                                                          : u.avatarUrl,
                                                      }
                                                    : u,
                                                ),
                                              );
                                              setSelectedUserId(null);
                                            }}
                                          >
                                            {tc("save")}
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Users />
                          </EmptyMedia>
                          <EmptyTitle>{t("empty.title")}</EmptyTitle>
                          <EmptyDescription>{t("empty.description")}</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                    <div className="text-sm text-muted-foreground">{t("userCount", { count: users.length })}</div>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-3">
                    <div className="space-y-1">
                      <Label>{t("fields.bulkInput")}</Label>
                      <Textarea
                        className="min-h-25"
                        placeholder={t("placeholders.bulkInput")}
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                      />
                    </div>
                    <Button onClick={addBulkUsers} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      {t("actions.addBulk")}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Avatar Style Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex-title gap-2">
                  <Palette />
                  {t("sections.style")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{ta("settings.avatarStyle")}</Label>
                  <Select value={styleKey} onValueChange={(v) => setStyleKey(v as AvatarStyleKey)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVATAR_STYLE_REGISTRY.map(({ key, style }) => (
                        <SelectItem key={key} value={key}>
                          {ta(`styles.${style.key}.name`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {ta(`styles.${selectedStyle?.key ?? "default"}.description`)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("style.showUsernames")}</Label>
                  <Switch checked={showUsernames} onCheckedChange={(value) => setShowUsernames(value)} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("style.showFlags")}</Label>
                  <Switch checked={showFlags} onCheckedChange={(value) => setShowFlags(value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Layout Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex-title gap-2">
                  <LayoutGrid />
                  {t("sections.layout")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("layout.columns")}</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[draftLayout.columns]}
                        onValueChange={([v]) => setDraftLayout({ ...draftLayout, columns: v })}
                        onValueCommit={([v]) => setLayout((current) => ({ ...current, columns: v }))}
                        min={1}
                        max={12}
                        step={1}
                      />
                      <span className="w-8 text-right text-sm">{draftLayout.columns}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("layout.gap")}</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[draftLayout.gap]}
                        onValueChange={([v]) => setDraftLayout({ ...draftLayout, gap: v })}
                        onValueCommit={([v]) => setLayout((current) => ({ ...current, gap: v }))}
                        min={0}
                        max={50}
                        step={1}
                      />
                      <span className="w-8 text-right text-sm">{draftLayout.gap}px</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("layout.padding")}</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[draftLayout.padding]}
                        onValueChange={([v]) => setDraftLayout({ ...draftLayout, padding: v })}
                        onValueCommit={([v]) => setLayout((current) => ({ ...current, padding: v }))}
                        min={0}
                        max={100}
                        step={4}
                      />
                      <span className="w-8 text-right text-sm">{draftLayout.padding}px</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex-title gap-2">
                  <ImageIcon />
                  {t("sections.background")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("background.type")}</Label>
                  <Select
                    value={background.type}
                    onValueChange={(v) =>
                      debouncedSetState.setBackground({ ...background, type: v as BackgroundConfig["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">{t("background.types.color")}</SelectItem>
                      <SelectItem value="gradient">{t("background.types.gradient")}</SelectItem>
                      <SelectItem value="image">{t("background.types.image")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {background.type === "color" && (
                  <div className="space-y-2">
                    <Label>{t("background.color")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={background.color}
                        onChange={(e) => debouncedSetState.setBackground({ ...background, color: e.target.value })}
                        className="w-16 h-9 p-1"
                      />
                      <Input
                        value={background.color}
                        onChange={(e) => debouncedSetState.setBackground({ ...background, color: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {background.type === "gradient" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t("background.gradientFrom")}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={background.gradientFrom || "#f8fafc"}
                          onChange={(e) =>
                            debouncedSetState.setBackground({ ...background, gradientFrom: e.target.value })
                          }
                          className="w-16 h-9 p-1"
                        />
                        <Input
                          value={background.gradientFrom || "#f8fafc"}
                          onChange={(e) =>
                            debouncedSetState.setBackground({ ...background, gradientFrom: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("background.gradientTo")}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={background.gradientTo || "#e2e8f0"}
                          onChange={(e) =>
                            debouncedSetState.setBackground({ ...background, gradientTo: e.target.value })
                          }
                          className="w-16 h-9 p-1"
                        />
                        <Input
                          value={background.gradientTo || "#e2e8f0"}
                          onChange={(e) =>
                            debouncedSetState.setBackground({ ...background, gradientTo: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("background.gradientDirection")}</Label>
                      <Select
                        value={background.gradientDirection || "to-bottom"}
                        onValueChange={(v) =>
                          debouncedSetState.setBackground({
                            ...background,
                            gradientDirection: v as BackgroundConfig["gradientDirection"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to-right">{t("directions.toRight")}</SelectItem>
                          <SelectItem value="to-bottom">{t("directions.toBottom")}</SelectItem>
                          <SelectItem value="to-bottom-right">{t("directions.toBottomRight")}</SelectItem>
                          <SelectItem value="to-bottom-left">{t("directions.toBottomLeft")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {background.type === "image" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t("background.imageUrl")}</Label>
                      <Input
                        placeholder="https://example.com/bg.jpg"
                        value={background.imageUrl || ""}
                        onChange={(e) => debouncedSetState.setBackground({ ...background, imageUrl: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("common.or")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleBackgroundImageUpload}
                      />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        {t("actions.uploadImage")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SaveDialog
        open={saveDialogOpen}
        baseName="avatar-grid"
        onOpenChange={setSaveDialogOpen}
        onSave={handleExportImage}
      />
    </div>
  );
}
