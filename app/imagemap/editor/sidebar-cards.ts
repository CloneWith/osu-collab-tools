import type { LucideIcon } from "lucide-react";
import { Camera, Code, FolderSync, ImageIcon, ListIcon, SlidersHorizontal } from "lucide-react";

export type SidebarCardId = "image" | "areas" | "area" | "code" | "save" | "io";

export interface SidebarCardDef {
    id: SidebarCardId;
    icon: LucideIcon;
    /** i18n key under the `imagemap` namespace. */
    titleKey: string;
    /**
     * Whether the card gets a button in the always-visible vertical rail.
     *
     * Import/export and save are driven from the bottom toolbar only, so they are
     * reachable from there and deliberately have no rail entry.
     */
    inRail: boolean;
    /** Whether the card content needs a selected area to be meaningful. */
    requiresSelection?: boolean;
}

/**
 * Sidebar card registry. The order here is the vertical order of the rail buttons.
 *
 * Note: `rotation` lives on `Rectangle`, not on `MappableArea`, precisely so that
 * `generateImageMapHtml` / `generateImageMapBBCode` cannot accidentally read it —
 * neither output format can express rotation.
 */
export const SIDEBAR_CARDS: readonly SidebarCardDef[] = [
    {
        id: "image",
        icon: ImageIcon,
        titleKey: "sidebar.cards.image",
        inRail: true,
    },
    {
        id: "areas",
        icon: ListIcon,
        titleKey: "sidebar.cards.areas",
        inRail: true,
    },
    {
        id: "area",
        icon: SlidersHorizontal,
        titleKey: "sidebar.cards.area",
        inRail: true,
        requiresSelection: true,
    },
    { id: "code", icon: Code, titleKey: "sidebar.cards.code", inRail: true },
    { id: "save", icon: Camera, titleKey: "sidebar.cards.save", inRail: false },
    { id: "io", icon: FolderSync, titleKey: "sidebar.cards.io", inRail: false },
] as const;

/** The subset that gets a rail button. */
export const RAIL_CARDS = SIDEBAR_CARDS.filter((def) => def.inRail);

/** Width of the card column, in rem. Animates to 0 when no card is open. */
export const SIDEBAR_WIDTH_REM = 22;

/** Width of the always-visible vertical rail, in rem. */
export const RAIL_WIDTH_REM = 3;

/**
 * Cards shown when the editor first mounts.
 *
 * Empty on purpose: the editor opens on just the preview, and the rail is how the
 * user brings a card in. Pre-opening cards would push the preview sideways before
 * the user asked for it.
 */
export const DEFAULT_OPEN_CARDS: ReadonlySet<SidebarCardId> = new Set<SidebarCardId>();
