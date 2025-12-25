import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { common } from "@/app/common";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

// 用户设置的服务器链接，用于生成资料链接与获取头像
function getServerLink() {
    return typeof window !== "undefined"
        ? (localStorage.getItem("custom_endpoint") ?? common.defaultEndpoint)
        // 在 SSR / 构建阶段没有 window / localStorage
        : common.defaultEndpoint;
}

export function generateUserLinkFromId(userId: number) {
    return encodeURI(`${getServerLink()}/users/${userId}`.toWellFormed());
}

export function generateUserLinkFromName(username: string) {
    // 注意替换空格 避免 BBCode 误识别
    return encodeURI(`${getServerLink()}/u/${username}`.toWellFormed());
}

/**
 * Get a country flag image URL from ISO country code.
 * Uses flagcdn.com SVG assets.
 * - Normalizes to lowercase
 * - Maps UK -> GB
 */
export function getCountryFlagUrl(code?: string): string | undefined {
    if (!code) return undefined;
    let normalized = code.trim().toLowerCase();
    if (normalized === "uk") normalized = "gb";
    // Some environments prefer PNG; using SVG keeps it crisp.
    return `https://flagcdn.com/${normalized}.svg`;
}

/**
 * Build a proxied URL for images to avoid CORS issues
 * when rendering them to canvas.
 */
export function getProxiedImageUrl(url?: string): string | undefined {
    if (!url) return undefined;
    try {
        // External image proxy compatible with static export
        // wsrv.nl provides CORS-enabled image responses
        const encoded = encodeURIComponent(url);
        // keep original dimensions; no transformation params
        return `https://wsrv.nl/?url=${encoded}`;
    } catch {
        return undefined;
    }
}
