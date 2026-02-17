"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CircleDotDashed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";
import { common } from "@/app/common";
import { useTranslation } from "react-i18next";
import "../lib/i18n";

export default function WorkingPlaceholder() {
  const {t} = useTranslation("common");
  return (
    <Card className="h-96 lg:h-125">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center space-y-2">
        <CircleDotDashed className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin"/>
        <b className="text-4xl animate-pulse">WIP</b>
        <div className="flex flex-col text-center items-center justify-center">
          {t("wip.description")}
        </div>
        <hr/>
        <div className="text-sm text-muted-foreground">{t("wip.hurry")}</div>
        <Link href={common.repoUrl}>
          <Button size="lg" className="text-lg px-8 py-3">
            {t("wip.checkProgress")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
