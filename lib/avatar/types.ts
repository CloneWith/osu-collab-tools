/**
 * Shared identity fields for user-like avatar entities.
 */
export interface AvatarIdentity {
    /** Display username. */
    username: string;
    /** Optional ISO 3166-1 alpha-2 country/region code (for example: US, CN). */
    countryCode?: string;
    /** Optional numeric/string user identifier used by upstream profile links. */
    userId?: string;
}

/**
 * Shared image source fields for avatar renderers.
 */
export interface AvatarImageSource {
    /** Avatar image URL. */
    imageUrl: string;
}

/**
 * A reference to an avatar style preset.
 */
export interface AvatarStyleRef {
    /** Style key (for example: classic, modern, simple). */
    styleKey: string;
}

/**
 * Grid-specific avatar image source naming.
 */
export interface AvatarGridImageSource {
    /** Avatar image URL used by the grid module field naming. */
    avatarUrl: string;
}

/**
 * Optional custom destination link for an avatar entry.
 */
export interface AvatarLinkTarget {
    /** Optional custom URL used in generated map links. */
    customLink?: string;
}

/**
 * Canonical avatar model used by the avatar card generator.
 */
export interface AvatarCardModel extends AvatarIdentity, AvatarImageSource, AvatarStyleRef {}

/**
 * Canonical user model used by the avatar grid generator.
 */
export interface AvatarGridUserModel extends AvatarIdentity, AvatarGridImageSource, AvatarLinkTarget {}
