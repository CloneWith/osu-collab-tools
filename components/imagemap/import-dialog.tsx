"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImageMapConfig) => void;
  imageWidth: number;
  imageHeight: number;
}

type DataSource = "json-conf" | "bbcode";

export function ImportDialog({open, onOpenChange, onImport, imageWidth, imageHeight}: ImportDialogProps) {
  const {toast} = useToast();
  const [confInput, setConfInput] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [currentSource, setCurrentSource] = useState<DataSource>("json-conf");

  // 实时验证
  useEffect(() => {
    setValidationError("");
    setIsValid(false);

    if (!confInput.trim()) {
      return;
    }

    switch (currentSource) {
      case "json-conf": {
        // 验证 JSON 语法和数据结构
        try {
          const parsed = JSON.parse(confInput);
          const result = validateImageMapJsonConfig(parsed);

          // 验证数据结构
          if (!result.success) {
            setValidationError(result.message ?? "配置文件无效");
            return;
          }

          setIsValid(true);
          setValidationError("");
        } catch (error) {
          if (error instanceof SyntaxError) {
            setValidationError(`JSON 语法错误: ${error.message}`);
          } else {
            setValidationError("无效的 JSON 格式");
          }
        }
        break;
      }

      case "bbcode": {
        const result = parseImageMapBBCode(confInput, imageWidth, imageHeight);

        if (!result.success) {
          setValidationError(result.message ?? "配置文件无效");
          return;
        }

        setIsValid(true);
        setValidationError("");
        break;
      }
    }
  }, [confInput]);

  const handleImport = () => {
    try {
      let parsed, result;

      switch (currentSource) {
        case "json-conf": {
          parsed = JSON.parse(confInput);
          result = validateImageMapJsonConfig(parsed);
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
          title: "导入失败",
          description: result.message,
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
        title: "导入成功",
        description: `已加载 ${parsed.rectangles.length} 个区域`,
      });
    } catch (error) {
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
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
        title: "无法读取剪贴板",
        description: "请检查权限设置",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex flex-row items-center gap-2">
            <Upload className="w-5 h-5"/>
            导入配置
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span>快速恢复之前的工作，在下方区域输入要导入的数据。</span>
            <br/>
            <span className="text-orange-400"><b>注意</b>：导入配置后，已定义的区域将被全部覆盖，配置中定义的内容将覆盖已有内容。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <Label>数据源</Label>
          <Select value={currentSource} onValueChange={(s) => setCurrentSource(s as DataSource)}>
            <SelectTrigger>
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json-conf">JSON 配置文件</SelectItem>
              <SelectItem value="bbcode">BBCode</SelectItem>
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
              className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">验证失败</p>
                <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
              </div>
            </div>
          ) : isValid ? (
            <div
              className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">格式正确，可以导入</p>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="outline"
            onClick={handlePaste}
            className="gap-2"
          >
            <ClipboardPaste className="w-4 h-4"/>
            从剪贴板粘贴
          </Button>
          <Button
            onClick={handleImport}
            disabled={!isValid}
            className="gap-2"
          >
            <Download className="w-4 h-4"/>
            导入配置
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
