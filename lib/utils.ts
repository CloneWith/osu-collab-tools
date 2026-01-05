import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { common } from "@/app/common";
import flagFallback from "@/public/flag-fallback.png";

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

export enum FlagTheme {
    Normal,
    Twemoji,
}

/**
 * Get a country flag image URL from ISO country code.
 * Uses Twemoji SVG assets and proxies the request to avoid CORS issues.
 */
export async function getCountryFlagDataUrl(code: string, theme: FlagTheme): Promise<string> {
    const trimmed = code.trim();
    let url = "";

    // Normal for country codes
    if (trimmed.length !== 2) return flagFallback.src;

    switch (theme) {
        case FlagTheme.Normal:
            url = `https://flagcdn.com/${trimmed.toLowerCase()}.svg`;
            break;

        case FlagTheme.Twemoji: {
            const baseFileName = trimmed
                .toUpperCase()
                .split('')
                .map((c) => (c.charCodeAt(0) + 127397).toString(16))
                .join('-');

            url = `https://twemoji.maxcdn.com/v/latest/72x72/${baseFileName}.png`;
            break;
        }
    }

    // Use a proxy to avoid CORS issues
    try {
        const response = await fetch(getProxiedImageUrl(url));
        if (response.ok) {
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(flagFallback.src);
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        console.error("Failed to fetch flag:", error);
    }

    return flagFallback.src;
}

/**
 * Build a proxied URL for images to avoid CORS issues
 * when rendering them to canvas.
 *
 * The result is guaranteed to be a string.
 */
export function getProxiedImageUrl(url?: string): string {
    if (!url) return "";
    try {
        // External image proxy compatible with static export
        // wsrv.nl provides CORS-enabled image responses
        const encoded = encodeURIComponent(url);
        // keep original dimensions; no transformation params
        return `https://wsrv.nl/?url=${encoded}`;
    } catch {
        return "";
    }
}
