"use client";

import { common } from "@/app/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export function ImagePropsCard({
  imagePath,
  mapName,
  onImagePathChange,
  onMapNameChange,
}: {
  imagePath: string | undefined;
  mapName: string | undefined;
  onImagePathChange: (value: string | undefined) => void;
  onMapNameChange: (value: string | undefined) => void;
}) {
  const t = useTranslations("imagemap");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="imageUrl">{t("imgAttrs.imgLink")}</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imagePath ?? ""}
          onChange={(e) => onImagePathChange(e.target.value)}
          onBlur={(e) => onImagePathChange(e.target.value.trim() || undefined)}
          placeholder={common.urlPlaceholder}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="mapName">{t("imgAttrs.mapName")}</Label>
        <Input
          id="mapName"
          value={mapName ?? ""}
          onChange={(e) => onMapNameChange(e.target.value)}
          onBlur={(e) => onMapNameChange(e.target.value.trim() || undefined)}
          placeholder="imagemap"
        />
      </div>
    </div>
  );
}
