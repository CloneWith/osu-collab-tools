"use client";

import { CopyButton } from "@/components/ui/copy-button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Code } from "lucide-react";
import { useTranslations } from "next-intl";

export function CodeCard({
  hasImage,
  hasRegions,
  htmlCode,
  bbCode,
  highlightedHtml,
  highlightedBBCode,
}: {
  hasImage: boolean;
  hasRegions: boolean;
  htmlCode: string;
  bbCode: string;
  highlightedHtml: string;
  highlightedBBCode: string;
}) {
  const t = useTranslations("imagemap");

  return (
    <div className="space-y-3">
      {/* The generated strings are always non-empty, so emptiness has to be decided
          from the inputs rather than from the output. */}
      {hasImage && hasRegions ? (
        <>
          <CodeBlock
            title="HTML"
            text={htmlCode}
            highlighted={highlightedHtml}
          />
          <CodeBlock
            title="BBCode"
            text={bbCode}
            highlighted={highlightedBBCode}
          />
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Code />
            </EmptyMedia>
            <EmptyTitle>{t("placeholder.noCode.title")}</EmptyTitle>
            <EmptyDescription>
              {t("placeholder.noCode.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

function CodeBlock({
  title,
  text,
  highlighted,
}: {
  title: string;
  text: string;
  highlighted: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <CopyButton text={text} size="sm" />
      </div>
      <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-auto max-h-64">
        <pre className="whitespace-pre-wrap wrap-break-word">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
}
