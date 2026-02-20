"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { common } from "@/app/common";
import { useTranslations } from "next-intl";

export default function InfoDocCard() {
  const t = useTranslations("docs");
  return (
    <Card id="info">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5"/>
          {t("sections.intro")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>{t("intro.description")}</p>
        <p>{t("intro.motivation")}</p>
        <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
          <li>{t("intro.features.flexible")}</li>
          <li>{t("intro.features.secure")}</li>
          <li>{t("intro.features.integrated")}</li>
        </ul>
        <p>{t.rich("intro.github", {repoLink: (link) => <a href={common.repoUrl} className="doc-link">{link}</a>})}</p>
      </CardContent>
    </Card>
  );
}
