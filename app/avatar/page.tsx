"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { IAvatarStyle, AvatarInputs } from "./styles/IAvatarStyle";
import { ClassicAvatarStyle } from "./styles/ClassicAvatarStyle";
import { Eye, Settings, Download, UserRoundPen } from "lucide-react";
import { HelpIconButton } from "@/components/help-icon-button";
import { useToast } from "@/hooks/use-toast";
import { snapdom } from "@zumer/snapdom";
import { SimpleAvatarStyle } from "@/app/avatar/styles/SimpleAvatarStyle";
import { ModernAvatarStyle } from "@/app/avatar/styles/ModernAvatarStyle";
import { isNullOrWhitespace } from "@/lib/utils";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useTranslation } from "react-i18next";

// 注册所有可用样式
const STYLE_REGISTRY = [
  {key: "classic", style: new ClassicAvatarStyle() as IAvatarStyle},
  {key: "modern", style: new ModernAvatarStyle() as IAvatarStyle},
  {key: "simple", style: new SimpleAvatarStyle() as IAvatarStyle},
] as const;

type StyleKey = typeof STYLE_REGISTRY[number]["key"];

const SCALE_REGISTRY = [
  {key: "0.5x", scale: 0.5},
  {key: "0.75x", scale: 0.75},
  {key: "1x", scale: 1},
  {key: "1.5x", scale: 1.5},
  {key: "2x", scale: 2},
  {key: "3x", scale: 3},
  {key: "4x", scale: 4},
] as const;

export default function AvatarGeneratorPage() {
  const {t} = useTranslation("avatar");
  const {toast} = useToast();

  const [styleKey, setStyleKey] = useState<StyleKey>(STYLE_REGISTRY[0].key);
  const selectedStyle = STYLE_REGISTRY.find(s => s.key === styleKey)?.style;

  const [imageUrl, setImageUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [selectedExportScale, setSelectedExportScale] = useState<string>("1x");

  // 缓冲输入
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [inputCountryCode, setInputCountryCode] = useState<string>("");
  const reloadTimerRef = useRef<NodeJS.Timeout>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);

  const inputs: AvatarInputs = useMemo(() => ({
    imageUrl,
    username,
    countryCode: countryCode ? countryCode.trim().toUpperCase() : undefined,
  }), [imageUrl, username, countryCode]);

  const previewEl = useMemo(() => {
    try {
      if (isNullOrWhitespace(imageUrl) || isNullOrWhitespace(username)) return null;
      const AvatarComponent = selectedStyle?.generateAvatar(inputs);
      return AvatarComponent ? <AvatarComponent/> : null;
    } catch (e) {
      console.error("Error in preview generation.", e);

      return (
        <div className="text-destructive text-sm">{t("previewError")}</div>
      );
    }
  }, [selectedStyle, inputs, imageUrl, username]);

  useEffect(() => {
    const container = previewRef.current;
    const child = container?.firstElementChild as HTMLElement | null;
    if (!child || !previewEl) {
      setPreviewSize(null);
      return;
    }
    const measure = () => setPreviewSize({width: child.offsetWidth, height: child.offsetHeight});
    requestAnimationFrame(measure);
  }, [previewEl]);

  // 头像与旗子的延时更新
  useEffect(() => {
    // This will always execute
    if (reloadTimerRef.current !== null) {
      clearTimeout(reloadTimerRef.current);
    }

    reloadTimerRef.current = setTimeout(() => {
      setImageUrl(inputImageUrl);
      setCountryCode(inputCountryCode);
    }, 300);
  }, [inputImageUrl, inputCountryCode]);

  const handleDownload = async () => {
    if (!previewRef.current?.firstElementChild) return;

    try {
      const scale = SCALE_REGISTRY.find(s => s.key === selectedExportScale)?.scale;
      if (!scale) {
        console.warn(`Cannot find a proper export scale for ${selectedExportScale}. Falling back to 1x.`);
      }

      const result = await snapdom(previewRef.current?.firstElementChild as HTMLElement);
      await result.download({
        filename: `avatar-${username}-${Date.now()}.png`,
        scale: scale ?? 1,
      });
    } catch (e) {
      toast({
        title: t("downloadError"),
        description: e instanceof Error ? e.message : t("common:unknownError"),
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
            <HelpIconButton section="avatar"/>
          </h1>
          <p className="text-secondary-foreground">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2"><Settings/>{t("common:section.settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{t("settings.avatarLink")}</Label>
                <Input
                  id="imageUrl"
                  placeholder={`https://a.ppy.sh/${t("settings.userIdPlaceholder")}`}
                  value={inputImageUrl}
                  onChange={(e) => setInputImageUrl(e.target.value)}
                  onBlur={_ => setImageUrl(inputImageUrl)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">{t("settings.username")}</Label>
                <Input
                  id="user"
                  placeholder="peppy"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">{t("settings.countryCode")}</Label>
                <Input
                  id="countryCode"
                  placeholder={t("settings.countryCodeDescription")}
                  value={inputCountryCode}
                  onChange={(e) => setInputCountryCode(e.target.value)}
                  onBlur={_ => setCountryCode(inputCountryCode)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarStyle">{t("settings.avatarStyle")}</Label>
                <Select value={styleKey} onValueChange={(v) => setStyleKey(v as StyleKey)}>
                  <SelectTrigger id="avatarStyle" className="w-full">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_REGISTRY.map(({key, style}) => (
                      <SelectItem key={key} value={key}>{t(`styles.${style.key}.name`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  className="text-sm text-muted-foreground">{t(`styles.${selectedStyle?.key ?? "default"}.description`)}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exportRes">{t("settings.exportScale")}</Label>
                <Select value={selectedExportScale} onValueChange={(v) => setSelectedExportScale(v)}>
                  <SelectTrigger id="exportRes" className="w-full">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_REGISTRY.map(({key}) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex-title gap-2"><Eye/>{t("common:section.preview")}</CardTitle>
                {previewEl && (
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4"/>
                    {t("common:download")}
                  </Button>
                )}
              </div>
              {previewEl && previewSize &&
                <CardDescription>{t("sizePrompt", {...previewSize})}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div ref={previewRef} className="flex items-center justify-center select-none">
                {previewEl ?? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserRoundPen/>
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
