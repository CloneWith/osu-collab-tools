"use client";

import type {
  SidebarCardDef,
  SidebarCardId,
} from "@/app/imagemap/editor/sidebar-cards";
import {
  RAIL_WIDTH_REM,
  SIDEBAR_WIDTH_REM,
} from "@/app/imagemap/editor/sidebar-cards";
import { SidebarPanel, SidebarRail } from "@/app/imagemap/editor/sidebar-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { PanelRightOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Full-viewport editor shell.
 *
 * Three columns: the preview, a card column that animates in and out, and a rail that
 * is always present. Because the rail has a permanent width, the transition only ever
 * moves the card column, and the preview is pushed left rather than covered.
 *
 * The card column has no independent open flag: it is shown exactly when at least one
 * card is open, which is what removes the need for a separate expand/collapse button.
 */
export function EditorShell({
  openCards,
  onToggleCard,
  hasImage,
  topBar,
  preview,
  toolbar,
  renderCard,
}: {
  openCards: ReadonlySet<SidebarCardId>;
  onToggleCard: (id: SidebarCardId) => void;
  hasImage: boolean;
  topBar: ReactNode;
  preview: ReactNode;
  toolbar: ReactNode;
  renderCard: (def: SidebarCardDef) => ReactNode;
}) {
  const isMobile = useIsMobile();
  const t = useTranslations("imagemap");

  const cardsOpen = openCards.size > 0;

  const panel = (
    <SidebarPanel
      openCards={openCards}
      onToggleCard={onToggleCard}
      renderCard={renderCard}
    />
  );

  const leftColumn = (
    <div className="flex min-h-0 min-w-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {topBar}
        {preview}
      </div>
      {toolbar}
    </div>
  );

  // A 22rem column would squeeze the preview to nothing on a phone, so the cards move
  // into a sheet there and share the same panel component. The rail stays visible.
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            {topBar}
            {preview}
          </div>
          {toolbar}
        </div>

        <SidebarRail
          openCards={openCards}
          onToggleCard={onToggleCard}
          hasImage={hasImage}
        />

        <Sheet
          open={cardsOpen}
          onOpenChange={(open) => !open && onToggleCard([...openCards][0])}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="sr-only"
              aria-label={t("sidebar.title")}
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,100vw)] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("sidebar.title")}</SheetTitle>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div
      className="grid h-full min-h-0 w-full motion-reduce:transition-none duration-200 ease-out transition-[grid-template-columns]"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) ${cardsOpen ? `${SIDEBAR_WIDTH_REM}rem` : "0rem"} ${RAIL_WIDTH_REM}rem`,
      }}
    >
      {leftColumn}

      <aside
        className="min-h-0 overflow-hidden"
        aria-hidden={!cardsOpen}
        inert={!cardsOpen}
      >
        {panel}
      </aside>

      <SidebarRail
        openCards={openCards}
        onToggleCard={onToggleCard}
        hasImage={hasImage}
      />
    </div>
  );
}
