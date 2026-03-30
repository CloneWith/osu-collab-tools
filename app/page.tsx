"use client";

import { TrianglesBackground } from "@/components/triangles-background";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createScope, createTimeline, type Scope, splitText, stagger } from "animejs";
import { ArrowRight, Construction } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function MainPage() {
  const t = useTranslations("home");
  const root = useRef(null);
  const scope = useRef<Scope>(null);

  useEffect(() => {
    scope.current = createScope({ root }).add((_) => {
      const { words } = splitText(".hero-title", { words: { wrap: "clip" } });

      createTimeline({ defaults: { ease: "inOut(3)", duration: 650 } })
        .add(words, { y: ["100%", "0%"] }, stagger(125))
        .init();
    });

    return () => scope.current?.revert();
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
            <h1 className="hero-title text-4xl md:text-6xl font-bold text-card-foreground mb-6">{t("hero.title")}</h1>
            <p className="text-xl text-card-foreground mb-8 max-w-3xl mx-auto">{t("hero.description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/imagemap">
                <Button size="lg" className="text-lg px-8 py-3">
                  {t("hero.startButton")}
                  <ArrowRight className="ml-2 w-5 h-5" />
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
              <Construction className="w-24 h-24" />
            </EmptyMedia>
            <EmptyTitle>{t("feature.title")}</EmptyTitle>
            <EmptyDescription>{t("feature.wip")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{t("feature.useNavigationBar")}</EmptyContent>
        </Empty>
      </section>
    </div>
  );
}
