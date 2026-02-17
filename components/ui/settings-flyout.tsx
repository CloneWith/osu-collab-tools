"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, Settings, Globe, Languages, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { common } from "@/app/common";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";

export function SettingsFlyout() {
  const {t} = useTranslation("settings");
  const endpointKey = "custom_endpoint";
  const [currentEndpoint, setCurrentEndpoint] = React.useState<string>(typeof window !== "undefined"
    ? (localStorage.getItem("custom_endpoint") ?? "")
    : "");

  const {theme, setTheme} = useTheme();
  const [themeValue, setThemeValue] = React.useState<string>(theme ?? "system");
  const [endpointValid, setEndpointValid] = React.useState<boolean>(true);

  useEffect(() => {
    // keep local selection synced with next-themes
    if (theme) setThemeValue(theme);
  }, [theme]);

  function onThemeChange(v: string) {
    setThemeValue(v);
    setTheme(v);
  }

  function onEndpointChange(v: string) {
    // 设置输入框默认值，这样在页面重载前总会保留用户值，与 endpointValid 状态同步
    // 重载后（隐式舍弃用户更改）使用存储值，保证显示出的值是有效的
    setCurrentEndpoint(v);

    // 先判断 v 空串的情况，此时删去自定义设置
    // 注意不是留空值，会导致工具使用的值异常
    if (v.length === 0) {
      setEndpointValid(true);
      localStorage.removeItem("custom_endpoint");
      return;
    }

    if (isValidURL(v)) {
      setEndpointValid(true);
      localStorage.setItem(endpointKey, v);
    } else {
      setEndpointValid(false);
    }
  }

  function isValidURL(src: string): boolean {
    try {
      const url = new URL(src);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="flex items-center space-x-2 p-2">
          <Settings className="w-4 h-4"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col space-y-3">
          <Label className="flex items-center flex-row gap-1 text-sm font-medium">
            <Languages className="w-4 h-4"/>{t("language")}
          </Label>
          <LanguageSwitcher/>

          <div>
            <Label className="text-sm font-medium">{t("colorScheme")}</Label>
          </div>

          {/* Segmented icon control matching provided design */}
          <div
            role="radiogroup"
            aria-label="颜色主题"
            className="inline-flex items-center rounded-full border border-border/60 bg-transparent p-1 justify-between"
          >
            {[
              {key: "light", icon: <Sun className="w-4 h-4"/>, title: t("themes.light")},
              {key: "system", icon: <SunMoon className="w-4 h-4"/>, title: t("themes.system")},
              {key: "dark", icon: <Moon className="w-4 h-4"/>, title: t("themes.dark")},
            ].map((opt, _, __) => {
              const selected = themeValue === (opt.key as string);
              return (
                <Button
                  key={opt.key}
                  variant="ghost"
                  title={opt.title}
                  onClick={() => onThemeChange(opt.key as string)}
                  className={
                    "relative flex items-center justify-center w-9 h-9 rounded-full transition-colors " +
                    (selected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/75 dark:hover:bg-primary/30")
                  }
                >
                  {/* icon */}
                  <span className="pointer-events-none">{opt.icon}</span>
                </Button>
              );
            })}
          </div>

          <div>
            <Label htmlFor="endpoint" className="text-sm font-medium">{t("serverEndpoint")}</Label>
            <div className="text-xs text-muted-foreground">{t("serverEndpointDescription")}</div>
          </div>
          <Input id="endpoint"
                 className={`w-full px-2 py-1 border font-mono text-sm ${endpointValid ? "" : "border-yellow-600"}`}
                 aria-label="服务器地址输入框"
                 placeholder={common.defaultEndpoint}
                 defaultValue={currentEndpoint}
                 onChange={(v) => onEndpointChange(v.target.value.trim())}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
