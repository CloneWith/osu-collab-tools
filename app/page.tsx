"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Zap, Smartphone, ArrowRight } from "lucide-react";
import { animate, createScope, createTimeline, cubicBezier, onScroll, Scope, splitText, stagger, utils } from "animejs";
import { TrianglesBackground } from "@/components/triangles-background";

export default function MainPage() {
    const root = useRef(null);
    const scope = useRef<Scope>(null);

    useEffect(() => {
        scope.current = createScope({root}).add(self => {
            const container = utils.$(".hero");

            animate(".feature-card", {
                y: [50, 0],
                opacity: 1,
                duration: 750,
                ease: cubicBezier(0.7, 0.1, 0.5, 0.9),
                autoplay: onScroll({container}),
            });

            const { words } = splitText('.hero-title', {
                words: { wrap: 'clip' },
            });

            createTimeline({
                defaults: { ease: 'inOut(3)', duration: 650 }
            })
                .add(words, {
                    y: [$el => +$el.dataset.line % 2 ? '100%' : '-150%', '0%'],
                }, stagger(125))
                .init();
        });

        return () => scope.current!.revert();
    }, []);

    return (
        <div ref={root} className="relative min-h-screen hero flex flex-col">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    {/* 三角形背景 */}
                    <div className="absolute inset-0 pointer-events-none">
                        <TrianglesBackground
                            color="#4a94e8"
                            opacity={0.75}
                            velocity={1.2 * 4 * 2}
                            spawnRatio={0.8 / 2.5}
                            thickness={0.015}
                            className="w-full h-full text-accent"
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="hero-title text-4xl md:text-6xl font-bold text-card-foreground mb-6">
                            这是一个
                            <span className="text-primary"> Collab </span>
                            工具箱
                        </h1>
                        <p className="text-xl text-card-foreground mb-8 max-w-3xl mx-auto">
                            助力你做出还不错的 osu! 赛博合影
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/editor">
                                <Button size="lg" className="text-lg px-8 py-3">
                                    开始使用
                                    <ArrowRight className="ml-2 w-5 h-5"/>
                                </Button>
                            </Link>
                            <Link href="/docs">
                                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                                    查看文档
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-primary/25">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">特性一览</h2>
                        <p className="text-xl text-card-foreground max-w-2xl mx-auto">
                            更多功能，正在添加中
                        </p>
                    </div>

                    <div className="feature-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Map,
                                title: "简洁易用",
                                description: "无需过多学习背后的基础知识",
                            },
                            {
                                icon: Smartphone,
                                title: "多端支持",
                                description: "前端赋能，随时随地，有浏览器就可以使用",
                            },
                            {
                                icon: Zap,
                                title: "全过程工具",
                                description: "尽可能提供一条龙服务",
                            },
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={index}
                                      className="feature-card text-center hover:shadow-lg transition-shadow opacity-0">
                                    <CardHeader>
                                        <div
                                            className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Icon className="w-6 h-6 text-primary"/>
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription
                                            className="text-card-foreground">{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">准备好开始了吗？</h2>
                    <p className="text-xl text-primary-foreground/85 mb-8 max-w-2xl mx-auto">
                        点击下面的按钮，试试感兴趣的功能吧╰(*°▽°*)╯
                    </p>
                    <Link href="/editor">
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                            立即开始
                            <ArrowRight className="ml-2 w-5 h-5"/>
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
