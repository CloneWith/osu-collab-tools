import { Card, CardContent } from "@/components/ui/card";
import { CircleDotDashed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";
import { common } from "@/app/common";

export default function WorkingPlaceholder() {
  return (
    <Card className="h-96 lg:h-[500px]">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center space-y-2">
        <CircleDotDashed className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin"/>
        <b className="text-4xl animate-pulse">WIP</b>
        <div className="flex flex-col text-center items-center justify-center">
          该功能还在开发中
        </div>
        <hr />
        <div className="text-sm text-muted-foreground">等不及？</div>
        <Link href={common.repoUrl}>
          <Button size="lg" className="text-lg px-8 py-3">
            查询进度
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
