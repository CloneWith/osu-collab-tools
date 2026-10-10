"use client";

import type { ImageMapConfig } from "@/app/imagemap/types";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfetti } from "@/hooks/use-confetti";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import { DownloadCloud, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

interface ExportPanelContentProps {
  data: ImageMapConfig;
}

// hljs 的语言注册是全局的，放在模块作用域配合守卫，
// 避免每次渲染都重复调用 registerLanguage。
let hljsInitialized = false;
const ensureJsonHljs = () => {
  if (hljsInitialized) return;
  hljs.registerLanguage("json", json);
  hljsInitialized = true;
};

/**
 * 导出面板的内容体。侧边栏卡片直接内联渲染它；
 * 需要弹窗外壳的调用方可以用 {@link ExportDialog} 包裹。
 */
export function ExportPanelContent({ data }: ExportPanelContentProps) {
  const triggerConfetti = useConfetti();
  const t = useTranslations("imagemap");
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  const jsonString = JSON.stringify(data, null, 2);

  ensureJsonHljs();

  const handleDownload = () => {
    if (downloadBtnRef.current) triggerConfetti(downloadBtnRef.current);

    const element = document.createElement("a");
    const file = new Blob([jsonString], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `imagemap-config-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <>
      <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-72 border border-gray-700">
        <pre
          className="whitespace-pre-wrap wrap-break-word"
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(jsonString, { language: "json" }).value,
          }}
        />
      </div>

      <div className="flex flex-row gap-2 justify-end">
        <CopyButton text={jsonString} variant="default" />
        <Button ref={downloadBtnRef} onClick={handleDownload} className="gap-2 confetti-button">
          <DownloadCloud className="w-4 h-4" />
          {t("export.downloadButton")}
        </Button>
      </div>
    </>
  );
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ImageMapConfig;
}

export function ExportDialog({ open, onOpenChange, data }: ExportDialogProps) {
  const t = useTranslations("imagemap");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center gap-2">
            <Upload className="w-5 h-5" />
            {t("export.title")}
          </DialogTitle>
          <DialogDescription>{t("export.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <ExportPanelContent data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
