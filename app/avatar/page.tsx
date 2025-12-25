"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { IAvatarStyle, AvatarInputs } from "./styles/IAvatarStyle";
import { ClassicAvatarStyle } from "./styles/ClassicAvatarStyle";
import { Eye, Settings } from "lucide-react";

// 注册所有可用样式
const STYLE_REGISTRY = [
  { key: "classic", style: new ClassicAvatarStyle() as IAvatarStyle },
] as const;

type StyleKey = typeof STYLE_REGISTRY[number]["key"];

export default function AvatarGeneratorPage() {
  const [styleKey, setStyleKey] = useState<StyleKey>(STYLE_REGISTRY[0].key);
  const selectedStyle = STYLE_REGISTRY.find(s => s.key === styleKey)!.style;

  const [imageUrl, setImageUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");

  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);

  const inputs: AvatarInputs = useMemo(() => ({
    imageUrl,
    username,
    countryCode: countryCode ? countryCode.trim().toUpperCase() : undefined,
  }), [imageUrl, username, countryCode]);

  const previewEl = useMemo(() => {
    try {
      if (!imageUrl || !username) return null;
      return selectedStyle.generateAvatar(inputs);
    } catch (e) {
      return (
        <div className="text-destructive text-sm">生成预览时出现问题。</div>
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
    const measure = () => setPreviewSize({ width: child.offsetWidth, height: child.offsetHeight });
    requestAnimationFrame(measure);
  }, [previewEl]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">资料图</span>
            生成
          </h1>
          <p className="text-secondary-foreground">生成各种样式的资料图</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2"><Settings/>设置</CardTitle>
              <CardDescription>填入资料并选择样式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">头像图片链接</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/avatar.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="peppy"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">国家/地区代码（可选）</Label>
                <Input
                  id="countryCode"
                  placeholder="两位地区码"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>头像样式</Label>
                <Select value={styleKey} onValueChange={(v) => setStyleKey(v as StyleKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择一种样式" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_REGISTRY.map(({ key, style }) => (
                      <SelectItem key={key} value={key}>{style.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">{selectedStyle.description}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2"><Eye/>预览</CardTitle>
              <CardDescription>
                {previewEl
                  ? `大小：${previewSize?.width ?? selectedStyle.size.width} × ${previewSize?.height ?? selectedStyle.size.height}`
                  : "在这里查看生成的头像"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={previewRef} className="flex items-center justify-center select-none">
                {previewEl ?? (
                  <div className="text-muted-foreground text-sm">
                    请先填写头像链接与用户名。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
