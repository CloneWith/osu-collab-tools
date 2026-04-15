"use client";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SettingsFlyout } from "@/components/ui/settings-flyout";
import { FileText, Grid3X3, Home, Map as MapIcon, Menu, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { key: "home", href: "/", icon: Home },
  { key: "avatar", href: "/avatar", icon: UserRound },
  { key: "avatargrid", href: "/avatargrid", icon: Grid3X3 },
  { key: "imagemap", href: "/imagemap", icon: MapIcon },
  { key: "docs", href: "/docs", icon: FileText },
] as const;

export function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-xs border-b sticky top-0 z-50">
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
              const title = t(`navbar.nav.${item.key}`);

              return (
                <HoverCard key={item.key} openDelay={120} closeDelay={80}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={item.href}
                      aria-label={title}
                      className={`flex items-center rounded-md text-sm font-medium ${
                        isActive
                          ? "bg-primary/10 px-3 py-2 text-primary"
                          : "h-10 w-10 justify-center text-gray-600 hover:bg-primary/10 hover:text-gray-900 dark:text-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span
                        className={`overflow-hidden whitespace-nowrap ${
                          isActive ? "ml-1.5 max-w-32 opacity-100" : "max-w-0 opacity-0"
                        }`}
                      >
                        {title}
                      </span>
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none text-popover-foreground">
                          {t(`${item.key}.title`)}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{t(`${item.key}.description`)}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
            <SettingsFlyout />
          </div>

          {/* Mobile menu button & theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <SettingsFlyout />
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                    key={item.key}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:text-gray-900 hover:bg-primary/10 dark:text-gray-300"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{t(`${item.key}.title`)}</span>
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
