import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { TrianglesBackground } from "@/components/triangles-background";

export default function NotFound() {
  return (
    <div className="relative h-screen">
      {/* 三角形背景 */}
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
          <Unlink className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-bounce"/>
          <b className="text-4xl animate-pulse">404</b>
          <div className="flex flex-col text-center items-center justify-center">
            你要找的或不在这里
          </div>
          <hr/>
          <Link href="/">
            <Button size="lg" className="text-lg px-8 py-3">
              回到主页
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
