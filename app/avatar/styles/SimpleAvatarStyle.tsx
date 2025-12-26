import type { ReactElement } from "react";
import { IAvatarStyle, AvatarInputs } from "./IAvatarStyle";
import { getCountryFlagUrl, getProxiedImageUrl } from "@/lib/utils";

export class SimpleAvatarStyle implements IAvatarStyle {
  name = "简洁";
  description = "小巧简约的头像卡片。";
  size = { width: 300, height: 300 };
  defaultFont = { family: "Torus", size: 24, weight: "700" };

  generateAvatar(inputs: AvatarInputs): ReactElement {
    const { width, height } = this.size;
    const font = inputs.font ?? this.defaultFont;

    return (
      <div
        style={{
          width,
          height,
          backgroundColor: "#0b0b0b",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        className="relative overflow-hidden rounded-2xl"
      >
        <img
          src={getProxiedImageUrl(inputs.imageUrl)}
          alt={inputs.username}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.05) contrast(1.05)" }}
        />

        <div
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)",
            fontFamily: font.family,
            fontWeight: font.weight,
            fontSize: font.size,
          }}
          className="absolute bottom-0 left-0 right-0 p-3 text-white flex items-center gap-2.5"
        >
          {inputs.countryCode ? (
            <img
              src={getProxiedImageUrl(getCountryFlagUrl(inputs.countryCode))}
              alt={inputs.countryCode}
              crossOrigin="anonymous"
              style={{height: 22}}
              className="object-cover rounded-md"
            />
          ) : null}
          <span style={{ letterSpacing: 0.2 }} className="truncate">{inputs.username}</span>
        </div>
      </div>
    );
  }
}
