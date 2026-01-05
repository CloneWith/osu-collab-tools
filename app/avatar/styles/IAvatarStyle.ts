/**
 * Represents a specific style of avatar.
 */
import React from "react";

/**
 * Inputs required to generate an avatar preview/component.
 */
export interface AvatarInputs {
    /** Source image URL for the avatar */
    imageUrl: string;
    /** Display name (username) to render */
    username: string;
    /** ISO country/region code like "US" / "CN" (optional) */
    countryCode?: string;
    /** Optional font override for this render */
    font?: {
        family?: string,
        size?: number,
        weight?: string,
    }
}

/**
 * Represents a specific style of avatar.
 */
export interface IAvatarStyle {
    name: string;
    description: string;

    /**
     * The size of an avatar image.
     */
    size: {
        width: number;
        height: number;
    },

    /**
     * The default font used for this style.
     */
    defaultFont: {
        family?: string,
        size?: number,
        weight?: string,
    }

    /**
     * Generate a React component representing the avatar preview
     * for the given inputs, honoring this style's size and defaults.
     */
    generateAvatar: (inputs: AvatarInputs) => React.FC;
}
