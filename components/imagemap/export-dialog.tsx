"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, DownloadCloud, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ImageMapConfig;
}

export function ExportDialog({open, onOpenChange, data}: ExportDialogProps) {
  const {toast} = useToast();
  const jsonString = JSON.stringify(data, null, 2);

  hljs.registerLanguage("json", json);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: "已复制",
        description: "JSON 配置已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([jsonString], {type: "application/json"});
    element.href = URL.createObjectURL(file);
    element.download = `imagemap-config-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);

    toast({
      title: "已下载",
      description: "配置文件已下载",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center gap-2">
            <Upload className="w-5 h-5"/>
            导出配置
          </DialogTitle>
          <DialogDescription>
            以下是当前 Imagemap 的 JSON 配置，您可以复制或下载它以供后用。
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
            关闭
          </Button>
          <Button
            variant="default"
            onClick={handleCopy}
            className="gap-2"
          >
            <Copy className="w-4 h-4"/>
            复制到剪贴板
          </Button>
          <Button
            onClick={handleDownload}
            className="gap-2"
          >
            <DownloadCloud className="w-4 h-4"/>
            下载 JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
