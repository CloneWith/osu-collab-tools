"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Map, Home, FileText, Menu, X, UserRound } from "lucide-react";
import { useState } from "react";
import { SettingsFlyout } from "@/components/ui/settings-flyout";
import Logo from "@/components/logo";

const navigation = [
    {name: "首页", href: "/", icon: Home},
    {name: "资料图", href: "/avatar", icon: UserRound},
    {name: "ImageMap 编辑", href: "/editor", icon: Map},
    {name: "文档", href: "/docs", icon: FileText},
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Logo />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Collab Tools</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-primary/10 text-primary dark:bg-primary dark:text-primary-foreground"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-primary/50 dark:hover:text-primary-foreground"
                                    }`}
                                >
                                    <Icon className="w-4 h-4"/>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                        <SettingsFlyout/>
                    </div>

                    {/* Mobile menu button & theme toggle */}
                    <div className="md:hidden flex items-center space-x-2">
                        <SettingsFlyout/>
                        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2">
                            {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                                            isActive ? "bg-primary/10 text-primary dark:bg-primary dark:text-primary-foreground" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Icon className="w-5 h-5"/>
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
