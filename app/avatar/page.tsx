"use client";

import { ModernAvatarStyle } from "@/app/avatar/styles/ModernAvatarStyle";
import { SimpleAvatarStyle } from "@/app/avatar/styles/SimpleAvatarStyle";
import { HelpIconButton } from "@/components/help-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn, debounce, isNullOrWhitespace } from "@/lib/utils";
import { snapdom } from "@zumer/snapdom";
import { Download, Eye, OctagonAlert, Settings, UserRoundPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClassicAvatarStyle } from "./styles/ClassicAvatarStyle";
import type { AvatarInputs, IAvatarStyle } from "./styles/IAvatarStyle";

// 注册所有可用样式
const STYLE_REGISTRY = [
  { key: "classic", style: new ClassicAvatarStyle() as IAvatarStyle },
  { key: "modern", style: new ModernAvatarStyle() as IAvatarStyle },
  { key: "simple", style: new SimpleAvatarStyle() as IAvatarStyle },
] as const;

type StyleKey = (typeof STYLE_REGISTRY)[number]["key"];

const SUPPORTED_SCALES = [0.5, 0.75, 1, 1.5, 2, 3, 4] as const;

export default function AvatarGeneratorPage() {
  const t = useTranslations("avatar");
  const tc = useTranslations("common");
  const { toast } = useToast();

  const [styleKey, setStyleKey] = useState<StyleKey>(STYLE_REGISTRY[0].key);
  const selectedStyle = useMemo(() => STYLE_REGISTRY.find((s) => s.key === styleKey)?.style, [styleKey]);

  const [imageUrl, setImageUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [exportScale, setExportScale] = useState(1);

  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  // 缓冲输入
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [inputCountryCode, setInputCountryCode] = useState<string>("");

  const inputs: AvatarInputs = useMemo(
    () => ({
      imageUrl,
      username,
      countryCode: countryCode || undefined,
    }),
    [imageUrl, username, countryCode],
  );

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

  const previewResult = useMemo(() => {
    try {
      if (isNullOrWhitespace(imageUrl) || isNullOrWhitespace(username)) {
        return { node: null, isAvatarCard: false };
      }

      const AvatarComponent = selectedStyle?.generateAvatar(inputs);
      if (!AvatarComponent) {
        return { node: null, isAvatarCard: false };
      }

      return { node: <AvatarComponent />, isAvatarCard: true };
    } catch (e) {
      console.error("Error in preview generation.", e);

      return {
        node: (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <OctagonAlert />
              </EmptyMedia>
              <EmptyTitle>{t("previewError")}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ),
        isAvatarCard: false,
      };
    }
  }, [selectedStyle, inputs, imageUrl, username, t]);

  const previewEl = previewResult.node;
  const shouldScalePreview = previewResult.isAvatarCard;

  useEffect(() => {
    const container = previewRef.current;
    const child = container?.firstElementChild as HTMLElement | null;
    if (!child || !shouldScalePreview) {
      setPreviewSize(null);
      return;
    }
    const measure = () => setPreviewSize({ width: child.offsetWidth, height: child.offsetHeight });
    requestAnimationFrame(measure);
  }, [shouldScalePreview]);

  const debouncedCommit = useMemo(
    () =>
      debounce((nextImageUrl: string, nextCountryCode: string) => {
        setImageUrl(nextImageUrl.trim());
        setCountryCode(nextCountryCode.trim().toUpperCase());
        setHasPendingUpdate(false);
      }, 300),
    [],
  );

  // 防抖更新
  useEffect(() => {
    if (inputImageUrl.trim() && username.trim()) {
      setHasPendingUpdate(true);
      debouncedCommit(inputImageUrl, inputCountryCode);
    }
  }, [inputImageUrl, inputCountryCode, debouncedCommit, username]);

  const handleDownload = async () => {
    if (!previewRef.current?.firstElementChild) return;

    try {
      const result = await snapdom(previewRef.current?.firstElementChild as HTMLElement);
      await result.download({
        filename: `avatar-${username}-${Date.now()}.png`,
        scale: exportScale,
      });
    } catch (e) {
      toast({
        title: t("downloadError"),
        description: e instanceof Error ? e.message : tc("unknownError"),
        variant: "destructive",
      });

      console.error("Error while generating card image.", e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="flex-title text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">{t("title")}</span>
            <HelpIconButton section="avatar" />
          </h1>
          <p className="text-secondary-foreground">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2">
                <Settings />
                {tc("section.settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{t("settings.avatarLink")}</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://a.ppy.sh/user_id"
                  value={inputImageUrl}
                  onChange={(e) => setInputImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">{t("settings.username")}</Label>
                <Input id="user" placeholder="peppy" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">{t("settings.countryCode")}</Label>
                <Input
                  id="countryCode"
                  placeholder={t("settings.countryCodeDescription")}
                  value={inputCountryCode}
                  onChange={(e) => setInputCountryCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarStyle">{t("settings.avatarStyle")}</Label>
                <Select value={styleKey} onValueChange={(v) => setStyleKey(v as StyleKey)}>
                  <SelectTrigger id="avatarStyle" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_REGISTRY.map(({ key, style }) => (
                      <SelectItem key={key} value={key}>
                        {t(`styles.${style.key}.name`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {t(`styles.${selectedStyle?.key ?? "default"}.description`)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exportRes">{t("settings.exportScale")}</Label>
                <Select
                  value={exportScale.toString()}
                  onValueChange={(v) => {
                    setExportScale(Number(v));
                  }}
                >
                  <SelectTrigger id="exportRes" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_SCALES.map((key) => (
                      <SelectItem key={key} value={key.toString()}>
                        {`${key}x`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2">
                <Eye />
                {tc("section.preview")}
              </CardTitle>
              <CardAction>
                {shouldScalePreview && (
                  <Button onClick={handleDownload} size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    {tc("download")}
                  </Button>
                )}
              </CardAction>
              {shouldScalePreview && previewSize && <CardDescription>{t("sizePrompt", { ...previewSize })}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div
                ref={previewRef}
                className={cn(
                  "flex items-center justify-center select-none transition-all",
                  hasPendingUpdate && "opacity-50",
                )}
                style={
                  shouldScalePreview
                    ? {
                        transform: `scale(${1 / devicePixelRatio})`,
                      }
                    : undefined
                }
              >
                {previewEl ?? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserRoundPen />
                      </EmptyMedia>
                      <EmptyTitle>{t("infoRequired")}</EmptyTitle>
                      <EmptyDescription>{t("infoRequiredDescription")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
