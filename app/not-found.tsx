"use client";

import { TrianglesBackground } from "@/components/triangles-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 pointer-events-none">
        <TrianglesBackground
          color="#4a94e8"
          opacity={0.75}
          velocity={1.2 * 4 * 2}
          spawnRatio={1.1 / 2.5}
          thickness={0.025}
          className="w-full h-full text-accent"
        />
      </div>
      <Card className="h-screen relative z-10 bg-muted/50">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center space-y-2 bg-transparent">
          <Unlink className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-bounce" />
          <b className="text-4xl animate-pulse">404</b>
          <div className="flex flex-col text-center items-center justify-center">{t("notFound.description")}</div>
          <hr />
          <Link href="/">
            <Button size="lg" className="text-lg px-8 py-3">
              {t("notFound.backHome")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
