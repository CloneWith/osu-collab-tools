"use client";

import {
  MIN_RECT_SIZE,
  normalizeRotation,
} from "@/app/imagemap/editor/geometry";
import { RectangleType, type Rectangle } from "@/app/imagemap/types";
import type { Avatar } from "@/app/avatar/types";
import { common } from "@/app/common";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AVATAR_STYLE_REGISTRY } from "@/lib/avatar/style-registry";
import { generateUserLinkFromId, generateUserLinkFromName } from "@/lib/utils";
import {
  CircleHelp,
  Copy,
  Hash,
  Info,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

const ROTATION_PRESETS = [-90, 0, 90, 180];

export function AreaSettingsCard({
  rect,
  positionBounds,
  sizeBounds,
  lastPositionInput,
  lastSizeInput,
  userInfo,
  onDuplicate,
  onDelete,
  onChangeField,
  onChangeType,
  onChangeAvatarField,
  onChangeRotation,
  onPositionInput,
  onSizeInput,
  onUserInfoChange,
}: {
  rect: Rectangle;
  positionBounds: { maxX: number; maxY: number };
  sizeBounds: { maxWidth: number; maxHeight: number };
  lastPositionInput: { x: string; y: string };
  lastSizeInput: { width: string; height: string };
  userInfo: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeField: (
    id: string,
    field: keyof Rectangle,
    value: string,
    castToNumber?: boolean,
  ) => void;
  onChangeType: (id: string, type: RectangleType) => void;
  onChangeAvatarField: (id: string, field: keyof Avatar, value: string) => void;
  onChangeRotation: (id: string, degrees: number) => void;
  onPositionInput: (field: "x" | "y", value: string) => void;
  onSizeInput: (field: "width" | "height", value: string) => void;
  onUserInfoChange: (value: string) => void;
}) {
  const t = useTranslations("imagemap");
  const ta = useTranslations("avatar");
  const tc = useTranslations("common");

  const isAvatar = rect.type === RectangleType.Avatar;
  // Stored normalized to [0, 360) but edited on a signed range so the slider follows
  // the direction the user drags.
  const rotation = normalizeRotation(rect.rotation);
  const signedRotation = rotation > 180 ? rotation - 360 : rotation;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDuplicate(rect.id)}
          className="flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          {tc("duplicate")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(rect.id)}
          className="flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          {tc("delete")}
        </Button>
      </div>

      {/* 区域类型选择 */}
      <div className="space-y-1">
        <Label htmlFor="rectType">{t("rectAttrs.rectType")}</Label>
        <Select
          value={rect.type}
          onValueChange={(e) => onChangeType(rect.id, e as RectangleType)}
        >
          <SelectTrigger id="rectType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="mapArea" value={RectangleType.MapArea}>
              {t("rectAttrs.types.mapArea")}
            </SelectItem>
            <SelectItem key="avatar" value={RectangleType.Avatar}>
              {t("rectAttrs.types.avatar")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Avatar 类型的专用属性 */}
      {isAvatar && (
        <>
          <div className="space-y-1">
            <Label htmlFor="avatarStyle">{ta("settings.avatarStyle")}</Label>
            <Select
              value={rect.avatar?.styleKey ?? "simple"}
              onValueChange={(e) => onChangeAvatarField(rect.id, "styleKey", e)}
            >
              <SelectTrigger id="avatarStyle">
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
          </div>
          <div className="space-y-1">
            <Label htmlFor="avatarLink">{ta("settings.avatarLink")}</Label>
            <Input
              id="avatarLink"
              placeholder="https://a.ppy.sh/user_id"
              value={rect.avatar?.imageUrl ?? ""}
              onChange={(e) =>
                onChangeAvatarField(rect.id, "imageUrl", e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="user">{ta("settings.username")}</Label>
              <Input
                id="user"
                placeholder="peppy"
                value={rect.avatar?.username ?? ""}
                onChange={(e) =>
                  onChangeAvatarField(rect.id, "username", e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="countryCode">{ta("settings.countryCode")}</Label>
              <Input
                id="countryCode"
                placeholder={ta("settings.countryCodeDescription")}
                value={rect.avatar?.countryCode ?? ""}
                onChange={(e) =>
                  onChangeAvatarField(rect.id, "countryCode", e.target.value)
                }
              />
            </div>
          </div>

          {/* Rotation: avatar areas only. Map areas cannot express it in either
              output format, so the control is simply absent for them. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rectRotation" className="flex items-center gap-1">
                {t("rectAttrs.rotation")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("rectAttrs.rotationAbout")}
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {t("rectAttrs.rotationAbout")}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm tabular-nums">
                  {rotation}°
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={t("rectAttrs.rotationReset")}
                  onClick={() => onChangeRotation(rect.id, 0)}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            </div>

            <Slider
              id="rectRotation"
              value={[signedRotation]}
              min={-180}
              max={180}
              step={1}
              onValueChange={([value]) => onChangeRotation(rect.id, value)}
              aria-label={t("rectAttrs.rotation")}
            />

            <div className="flex gap-1">
              {ROTATION_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant={signedRotation === preset ? "secondary" : "outline"}
                  className="flex-1 font-mono text-xs tabular-nums"
                  onClick={() => onChangeRotation(rect.id, preset)}
                >
                  {preset}°
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-1">
        <Label htmlFor="link">{t("rectAttrs.link")}</Label>
        <Input
          id="link"
          type="url"
          value={rect.href || ""}
          onChange={(e) => onChangeField(rect.id, "href", e.target.value)}
          placeholder={common.urlPlaceholder}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="altText">{t("rectAttrs.alt")}</Label>
        <Input
          id="altText"
          type="text"
          value={rect.alt || ""}
          onChange={(e) => onChangeField(rect.id, "alt", e.target.value)}
          placeholder={t("rectAttrs.altDescription")}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="userInfo">{t("rectAttrs.userInfo")}</Label>
        <InputGroup className="overflow-visible">
          <InputGroupInput
            id="userInfo"
            value={userInfo}
            onChange={(e) => onUserInfoChange(e.target.value)}
            onBlur={(e) => onUserInfoChange(e.target.value.trim())}
          />
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  disabled={
                    userInfo.trim().length === 0 ||
                    Number.isNaN(Number(userInfo))
                  }
                  onClick={() => {
                    onChangeField(
                      rect.id,
                      "href",
                      generateUserLinkFromId(Number(userInfo)),
                    );
                    onChangeAvatarField(
                      rect.id,
                      "imageUrl",
                      `https://a.ppy.sh/${userInfo}`,
                    );
                  }}
                >
                  <Hash className="w-4 h-4" />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>{t("rectAttrs.fillAsId")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  disabled={userInfo.trim().length === 0}
                  onClick={() => {
                    onChangeField(
                      rect.id,
                      "href",
                      generateUserLinkFromName(userInfo),
                    );
                    onChangeField(rect.id, "alt", userInfo);
                    onChangeAvatarField(rect.id, "username", userInfo);
                    onChangeAvatarField(
                      rect.id,
                      "imageUrl",
                      `https://a.ppy.sh/${userInfo}`,
                    );
                  }}
                >
                  <UserRound className="w-4 h-4" />
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
            onChange={(e) => onPositionInput("x", e.target.value)}
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
            onChange={(e) => onPositionInput("y", e.target.value)}
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
            onChange={(e) => onSizeInput("width", e.target.value)}
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
            onChange={(e) => onSizeInput("height", e.target.value)}
          />
        </div>
      </div>

      {/* Make the rotation boundary explicit: the preview and the exported image
          change, but the generated HTML / BBCode cannot carry it. */}
      {isAvatar && (
        <Alert>
          <AlertTitle className="flex items-center gap-2 text-sm">
            <Info className="size-4" />
            {t("rectAttrs.rotationHint.title")}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {t("rectAttrs.rotationHint.description")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
