"use client";

import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Zap, Code, Smartphone, ArrowRight, Aperture } from "lucide-react";

export default function MainPage() {
    return (
        <div className="min-h-screen hero flex flex-col">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-card-foreground mb-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
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
