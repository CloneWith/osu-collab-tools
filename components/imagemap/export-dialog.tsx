"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DownloadCloud, Upload } from "lucide-react";
import { ImageMapConfig } from "@/app/imagemap/types";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useConfetti } from "@/hooks/use-confetti";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ImageMapConfig;
}

export function ExportDialog({open, onOpenChange, data}: ExportDialogProps) {
  const triggerConfetti = useConfetti();
  const t = useTranslations("imagemap");
  const tc = useTranslations("common");

  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  const jsonString = JSON.stringify(data, null, 2);

  hljs.registerLanguage("json", json);

  const handleDownload = () => {
    if (downloadBtnRef.current) triggerConfetti(downloadBtnRef.current);

    const element = document.createElement("a");
    const file = new Blob([jsonString], {type: "application/json"});
    element.href = URL.createObjectURL(file);
    element.download = `imagemap-config-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center gap-2">
            <Upload className="w-5 h-5"/>
            {t("export.title")}
          </DialogTitle>
          <DialogDescription>
            {t("export.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96 border border-gray-700">
            <pre className="whitespace-pre-wrap wrap-break-word" dangerouslySetInnerHTML={{
              __html: hljs.highlight(jsonString, {language: "json"}).value,
            }}/>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <CopyButton text={jsonString} variant="default"/>
          <Button
            ref={downloadBtnRef}
            onClick={handleDownload}
            className="gap-2 confetti-button"
          >
            <DownloadCloud className="w-4 h-4"/>
            {t("export.downloadButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
