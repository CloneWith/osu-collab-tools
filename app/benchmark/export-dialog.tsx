"use client";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import { Braces } from "lucide-react";
import { useTranslations } from "next-intl";

interface BenchmarkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jsonString: string;
}

export function BenchmarkExportDialog({ open, onOpenChange, jsonString }: BenchmarkExportDialogProps) {
  const t = useTranslations("benchmark");
  const tc = useTranslations("common");

  hljs.registerLanguage("json", json);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Braces className="w-5 h-5" />
            {t("exportDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("exportDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96 border border-gray-700">
          <pre
            className="whitespace-pre-wrap wrap-break-word"
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(jsonString, { language: "json" }).value,
            }}
          />
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <CopyButton text={jsonString} variant="default" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
