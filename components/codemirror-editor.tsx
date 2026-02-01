"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { keymap, EditorView as ViewExt } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { githubDark } from "@fsegurai/codemirror-theme-github-dark";
import { cn } from "@/lib/utils";

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
}

export function CodeMirrorEditor({
  value,
  onChange,
  readOnly = false,
  className = "",
  height = "320px",
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const valueRef = useRef<string>(value);

  // 更新值引用以避免闭包问题
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清理旧编辑器
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    // 创建编辑器状态
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        githubDark,
        // 自动换行，避免横向溢出
        ViewExt.lineWrapping,
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            handleChange(newValue);
          }
        }),
        EditorView.editable.of(!readOnly),
        // 自定义主题和样式
        EditorView.theme({
          ".cm-editor": {
            height: "100%",
            fontSize: "14px",
            fontFamily:
              "'Cascadia Code', 'Fira Code', 'Menlo', 'Monaco', monospace",
            backgroundColor: "#1e1e1e",
          },
          ".cm-gutters": {
            backgroundColor: "#252526",
            borderRight: "1px solid #3e3e42",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#2d2d30",
          },
          ".cm-cursor": {
            borderLeftColor: "#aeafad",
          },
        }),
      ],
    });

    // 创建编辑器视图
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    // 自动聚焦
    view.focus();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [handleChange, readOnly]);

  // 同步外部值变化（避免不必要的更新）
  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.state.doc.toString() !== value
    ) {
      const changes = editorRef.current.state.changes({
        from: 0,
        to: editorRef.current.state.doc.length,
        insert: value,
      });

      editorRef.current.dispatch({ changes });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full border border-gray-700 rounded-md overflow-y-auto overflow-x-hidden bg-gray-900 dark:bg-gray-950", className)}
      style={{ height }}
    />
  );
}
