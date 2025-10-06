"use client"

import * as React from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor, Settings } from "lucide-react";
import { useTheme } from "next-themes"

export function SettingsFlyout() {
  const { theme, setTheme } = useTheme()
  const [value, setValue] = React.useState<string>(theme ?? "system")

  React.useEffect(() => {
    // keep local selection synced with next-themes
    if (theme) setValue(theme)
  }, [theme])

  function onChange(v: string) {
    setValue(v)
    setTheme(v)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2 p-2">
          <Settings className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col space-y-3">
          <div>
            <h4 className="text-sm font-medium">颜色主题</h4>
          </div>

          {/* Segmented icon control matching provided design */}
          <div
            role="radiogroup"
            aria-label="颜色主题"
            className="inline-flex items-center rounded-full border border-border/60 bg-transparent p-1 justify-between"
          >
            {[
              { key: "light", icon: <Sun className="w-4 h-4" />, title: "浅色" },
              { key: "system", icon: <Monitor className="w-4 h-4" />, title: "系统" },
              { key: "dark", icon: <Moon className="w-4 h-4" />, title: "深色" },
            ].map((opt, idx, arr) => {
              const selected = value === (opt.key as string)
              return (
                <Button
                  key={opt.key}
                  variant="ghost"
                  title={opt.title}
                  onClick={() => onChange(opt.key as string)}
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
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
