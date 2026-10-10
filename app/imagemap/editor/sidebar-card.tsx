"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { SidebarCardDef } from "./sidebar-cards";
import { cn } from "@/lib/utils";

/**
 * A single sidebar card.
 *
 * Show / hide uses the CSS grid `0fr -> 1fr` height-easing technique rather than a
 * measured pixel height: the browser animates the track size, so no ResizeObserver,
 * no JS animation loop, and no layout thrash while cards open and close.
 */
export function SidebarCard({
  def,
  open,
  onClose,
  children,
}: {
  def: SidebarCardDef;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("imagemap");
  const Icon = def.icon;

  return (
    <div
      id={`imagemap-sidebar-card-${def.id}`}
      aria-hidden={!open}
      // Without this, tabbing would land on inputs inside a collapsed card.
      inert={!open}
      className={cn(
        "grid shrink-0 transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      {/* The inner overflow-hidden is what makes 0fr actually collapse. Spacing between
          cards lives here rather than as a flex gap on the list, because a gap would
          still apply to the collapsed cards and never collapse with them. */}
      <div className="min-h-0 overflow-hidden">
        <div className="pb-2">
          <Card size="sm" className="gap-3 py-3">
            <CardHeader className="px-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4" />
                {t(def.titleKey)}
              </CardTitle>
              {/* CardAction already sits in the header's top-right grid cell. */}
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  aria-label={t("sidebar.closeCard")}
                  onClick={onClose}
                >
                  <X className="size-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-3">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
