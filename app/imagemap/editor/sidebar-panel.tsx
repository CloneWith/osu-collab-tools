"use client";

import { SidebarCard } from "@/app/imagemap/editor/sidebar-card";
import {
  DEFAULT_OPEN_CARDS,
  RAIL_CARDS,
  type SidebarCardDef,
  type SidebarCardId,
  SIDEBAR_CARDS,
  SIDEBAR_WIDTH_REM,
} from "@/app/imagemap/editor/sidebar-cards";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The card column. It renders every card regardless of rail membership, because
 * import/export and save are opened from the toolbar yet still appear here.
 */
export function SidebarPanel({
  openCards,
  onToggleCard,
  renderCard,
}: {
  openCards: ReadonlySet<SidebarCardId>;
  onToggleCard: (id: SidebarCardId) => void;
  /** Supplies each card's body, so the panel stays agnostic of editor state. */
  renderCard: (def: SidebarCardDef) => ReactNode;
}) {
  return (
    <div
      // No `gap-*` here: a flex gap applies between every child, so the five collapsed
      // cards would each contribute an invisible 8px gap and leave phantom spacing at
      // the bottom of an empty column. Card spacing lives inside each card instead.
      //
      // `scrollbar-none`: a classic scrollbar would steal ~15px of content width, so
      // a card that overflows would make every other card's text reflow sideways.
      className="scrollbar-none flex h-full min-h-0 flex-col overflow-y-auto p-3"
      // Fixed width: the outer column animates from 0 to SIDEBAR_WIDTH_REM, and a
      // percentage-width child would reflow its text on every animation frame.
      style={{ width: `${SIDEBAR_WIDTH_REM}rem` }}
    >
      {SIDEBAR_CARDS.map((def) => (
        <SidebarCard key={def.id} def={def} open={openCards.has(def.id)} onClose={() => onToggleCard(def.id)}>
          {renderCard(def)}
        </SidebarCard>
      ))}
    </div>
  );
}

/**
 * The always-visible vertical rail at the far right.
 *
 * It occupies its own column permanently, so opening a card adds the card column
 * beside it instead of covering the preview. With no cards open the column collapses
 * and the rail is all that remains — which is also why no separate expand/collapse
 * button is needed.
 */
export function SidebarRail({
  openCards,
  onToggleCard,
  hasImage,
}: {
  openCards: ReadonlySet<SidebarCardId>;
  onToggleCard: (id: SidebarCardId) => void;
  hasImage: boolean;
}) {
  const t = useTranslations("imagemap");

  return (
    <nav
      aria-label={t("sidebar.railLabel")}
      className="flex h-full min-h-0 flex-col items-center gap-1 overflow-y-auto border-l bg-card/40 p-1"
    >
      {RAIL_CARDS.map((def) => {
        const active = openCards.has(def.id);
        const Icon = def.icon;

        return (
          <Tooltip key={def.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={active}
                aria-label={t(def.titleKey)}
                disabled={!hasImage}
                className={cn(
                  "size-9 shrink-0",
                  active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onToggleCard(def.id)}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t(def.titleKey)}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export { DEFAULT_OPEN_CARDS };
