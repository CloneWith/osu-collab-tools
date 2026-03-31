import { ClassicAvatarStyle } from "@/app/avatar/styles/ClassicAvatarStyle";
import type { IAvatarStyle } from "@/app/avatar/styles/IAvatarStyle";
import { ModernAvatarStyle } from "@/app/avatar/styles/ModernAvatarStyle";
import { SimpleAvatarStyle } from "@/app/avatar/styles/SimpleAvatarStyle";

export const AVATAR_STYLE_REGISTRY = [
  { key: "classic", style: new ClassicAvatarStyle() as IAvatarStyle },
  { key: "modern", style: new ModernAvatarStyle() as IAvatarStyle },
  { key: "simple", style: new SimpleAvatarStyle() as IAvatarStyle },
] as const;

export type AvatarStyleKey = (typeof AVATAR_STYLE_REGISTRY)[number]["key"];
