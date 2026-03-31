import type { AvatarInputs, IAvatarStyle } from "@/app/avatar/styles/IAvatarStyle";
import type React from "react";

export interface AvatarRenderSource {
    styleKey: string;
    imageUrl: string;
    username: string;
    countryCode?: string;
}

export interface AvatarComponentCacheEntry {
    comp: React.FC;
    signature: string;
}

export type AvatarComponentCache = Map<string, AvatarComponentCacheEntry>;

export type AvatarStyleRegistry = ReadonlyArray<{ key: string; style: IAvatarStyle }>;

export const toAvatarInputs = (source: AvatarRenderSource): AvatarInputs => ({
    imageUrl: source.imageUrl,
    username: source.username,
    countryCode: source.countryCode?.trim() ? source.countryCode.trim().toUpperCase() : undefined,
});

const buildAvatarSignature = (styleKey: string, inputs: AvatarInputs) =>
    `${styleKey}|${inputs.imageUrl}|${inputs.username}|${inputs.countryCode}`;

export function resolveCachedAvatarComponent(
    cacheId: string,
    source: AvatarRenderSource,
    styleRegistry: AvatarStyleRegistry,
    cache: AvatarComponentCache,
): {
    component: React.FC;
    styleObj: IAvatarStyle;
    inputs: AvatarInputs;
} | null {
    const styleObj = styleRegistry.find((item) => item.key === source.styleKey)?.style;
    if (!styleObj) return null;

    const inputs = toAvatarInputs(source);
    const signature = buildAvatarSignature(source.styleKey, inputs);
    let cached = cache.get(cacheId);

    if (!cached || cached.signature !== signature) {
        try {
            const component = styleObj.generateAvatar(inputs);
            cached = { comp: component, signature };
            cache.set(cacheId, cached);
        } catch {
            return null;
        }
    }

    return { component: cached.comp, styleObj, inputs };
}
