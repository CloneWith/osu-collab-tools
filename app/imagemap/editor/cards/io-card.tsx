"use client";

import { ExportPanelContent } from "@/components/imagemap/export-dialog";
import { ImportPanelContent } from "@/components/imagemap/import-dialog";
import type { ImageMapConfig } from "@/app/imagemap/types";
import { useTranslations } from "next-intl";

/**
 * Import and export share one card, mirroring the toolbar's single combined button.
 * Both panels used to be modal dialogs; they are now inline so the sidebar stays
 * the single workspace.
 */
export function IoCard({
  exportData,
  imageWidth,
  imageHeight,
  canExport,
  onImport,
}: {
  exportData: ImageMapConfig;
  imageWidth: number;
  imageHeight: number;
  canExport: boolean;
  onImport: (data: ImageMapConfig) => void;
}) {
  const t = useTranslations("imagemap");

  return (
    <div className="space-y-4">
      <ImportPanelContent
        onImport={onImport}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm text-muted-foreground">
          {t("export.description")}
        </p>
        {canExport ? (
          <ExportPanelContent data={exportData} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("export.unavailable")}
          </p>
        )}
      </div>
    </div>
  );
}
