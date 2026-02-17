"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { createScope, createTimeline, Scope, splitText, stagger } from "animejs";
import { TrianglesBackground } from "@/components/triangles-background";
import { useTranslation } from "react-i18next";
import "../lib/i18n";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"; // 导入 i18n 配置

export default function MainPage() {
  const {t} = useTranslation("home");
  const root = useRef(null);
  const scope = useRef<Scope>(null);

  useEffect(() => {
    scope.current = createScope({root}).add(self => {
      const {words} = splitText(".hero-title", {
        words: {wrap: "clip"},
      });

      createTimeline({
        defaults: {ease: "inOut(3)", duration: 650},
      })
        .add(words, {
          y: [$el => +$el.dataset.line % 2 ? "100%" : "-150%", "0%"],
        }, stagger(125))
        .init();
    });

    return () => scope.current!.revert();
  }, []);

  return (
    <div ref={root} className="relative min-h-screen hero flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-24 relative z-10 bg-muted/50">
          <div className="text-center">
            <h1 className="hero-title text-4xl md:text-6xl font-bold text-card-foreground mb-6">
              {t("hero.title", {interpolation: {escapeValue: false}})}
            </h1>
            <p className="text-xl text-card-foreground mb-8 max-w-3xl mx-auto">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/imagemap">
                <Button size="lg" className="text-lg px-8 py-3">
                  {t("hero.startButton")}
                  <ArrowRight className="ml-2 w-5 h-5"/>
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                  {t("hero.docsButton")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-48 bg-primary/25">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <ArrowUpRight className="w-24 h-24"/>
            </EmptyMedia>
            <EmptyTitle>草</EmptyTitle>
            <EmptyDescription>请稍后再来。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            使用导航栏选择工具
          </EmptyContent>
        </Empty>
      </section>
    </div>
  );
}
