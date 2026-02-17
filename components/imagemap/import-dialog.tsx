"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle, ClipboardPaste, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ImageMapConfig,
  parseImageMapBBCode,
  validateImageMapJsonConfig,
} from "@/app/imagemap/types";
import { CodeMirrorEditor } from "../codemirror-editor";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timeout } from "@radix-ui/primitive";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImageMapConfig) => void;
  imageWidth: number;
  imageHeight: number;
}

type DataSource = "json" | "bbcode";

export function ImportDialog({open, onOpenChange, onImport, imageWidth, imageHeight}: ImportDialogProps) {
  const {toast} = useToast();
  const {t} = useTranslation("imagemap");

  const [confInput, setConfInput] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [currentSource, setCurrentSource] = useState<DataSource>("json");
  const [inputActive, setInputActive] = useState<boolean>();
  const currentTimerRef = useRef<Timeout>(null);

  // 实时验证
  useEffect(() => {
    // This will always execute
    if (currentTimerRef.current !== null) {
      clearTimeout(currentTimerRef.current);
    }

    setInputActive(true);
    currentTimerRef.current = setTimeout(() => {
      setInputActive(false);
      checkConf();
    }, 500);
  }, [confInput]);

  useEffect(() => {
    checkConf();
  }, [currentSource]);

  const checkConf = () => {
    setValidationError("");
    setIsValid(false);

    if (!confInput.trim()) {
      return;
    }

    switch (currentSource) {
      case "json": {
        // 验证 JSON 语法和数据结构
        try {
          const parsed = JSON.parse(confInput);
          const result = validateImageMapJsonConfig(parsed, imageWidth, imageHeight);

          // 验证数据结构
          if (!result.success) {
            setValidationError(t(result.messageKey ?? "import.check.invalid", result.details));
            return;
          }

          setIsValid(true);
          setValidationError("");
        } catch (error) {
          if (error instanceof SyntaxError) {
            setValidationError(t("import.check.jsonSyntaxError", {message: error.message}));
          } else {
            setValidationError(t("import.check.invalidJsonFormat"));
          }
        }
        break;
      }

      case "bbcode": {
        const result = parseImageMapBBCode(confInput, imageWidth, imageHeight);

        if (!result.success) {
          setValidationError(t(result.messageKey ?? "import.check.invalid", result.details));
          return;
        }

        setIsValid(true);
        setValidationError("");
        break;
      }
    }
  };

  const handleImport = () => {
    try {
      let parsed, result;

      switch (currentSource) {
        case "json": {
          parsed = JSON.parse(confInput);
          result = validateImageMapJsonConfig(parsed, imageWidth, imageHeight);
          break;
        }

        case "bbcode": {
          result = parseImageMapBBCode(confInput, imageWidth, imageHeight);
          parsed = result.config;
          break;
        }
      }

      if (!result.success) {
        toast({
          title: t("import.failed"),
          description: t(result.messageKey ?? "import.check.invalid", result.details),
          variant: "destructive",
        });
        return;
      }

      onImport(parsed);
      setConfInput("");
      setValidationError("");
      setIsValid(false);
      onOpenChange(false);

      toast({
        title: t("import.success"),
        description: t("import.importInfo", {count: parsed.rectangles.length}),
      });
    } catch (error) {
      toast({
        title: t("import.failed"),
        description: error instanceof Error ? error.message : t("common:unknownError"),
        variant: "destructive",
      });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setConfInput(text);
    } catch (error) {
      toast({
        title: t("common:cannotReadClipboard"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center gap-2">
            <Upload className="w-5 h-5"/>
            {t("import.title")}
          </DialogTitle>
          <DialogDescription><span>{t("import.description")}</span></DialogDescription>
        </DialogHeader>

        <Alert variant="warning">
          <AlertDescription>{t("import.overrideWarning")}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label htmlFor="dataSource">{t("import.dataSource")}</Label>
          <Select value={currentSource} onValueChange={(s) => setCurrentSource(s as DataSource)}>
            <SelectTrigger id="dataSource">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">{t("import.sources.json")}</SelectItem>
              <SelectItem value="bbcode">{t("import.sources.bbcode")}</SelectItem>
            </SelectContent>
          </Select>

          {/* CodeMirror 编辑器区域 */}
          <CodeMirrorEditor
            value={confInput}
            onChange={setConfInput}
            className="border-gray-700"
          />

          {/* 验证状态指示 */}
          {validationError ? (
            <div
              className={`flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md ${inputActive && "opacity-30"}`}>
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{t("import.validationFailed")}</p>
                <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
              </div>
            </div>
          ) : isValid ? (
            <div
              className={`flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md ${inputActive && "opacity-30"}`}>
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">t{"import.validationPassed"}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={handlePaste}
            className="gap-2"
          >
            <ClipboardPaste className="w-4 h-4"/>
            {t("import.fromClipboard")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!isValid || inputActive}
            className="gap-2"
          >
            <Download className="w-4 h-4"/>
            {t("import.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
