import type React from "react";
import { useState, useEffect } from "react";
import type { AvatarInputs, IAvatarStyle } from "./IAvatarStyle";
import { FlagTheme, getCountryFlagDataUrl, getProxiedImageUrl } from "@/lib/utils";
import flagFallback from "@/public/flag-fallback.png";
import { torus } from "@/lib/fonts";

export class SimpleAvatarStyle implements IAvatarStyle {
  key = "simple";
  size = { width: 300, height: 300 };
  defaultFont = { family: "Torus", size: 24, weight: "700" };

  generateAvatar = (inputs: AvatarInputs): React.FC => {
    const { width, height } = this.size;
    const font = inputs.font ?? this.defaultFont;

    return () => {
      const [flagUrl, setFlagUrl] = useState(flagFallback.src);

      useEffect(() => {
        if (inputs.countryCode) {
          getCountryFlagDataUrl(inputs.countryCode, FlagTheme.Twemoji).then(setFlagUrl);
        }
      }, [inputs.countryCode]);

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
            draggable={false}
            className="object-cover select-none"
            style={{
              width,
              height,
              filter: "saturate(1.05) contrast(1.05)",
            }}
          />

          <div
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)",
              fontWeight: font.weight,
              fontSize: font.size,
            }}
            className={`absolute bottom-0 left-0 right-0 p-3 text-white flex items-center gap-2.5 ${torus.className}`}
          >
            {inputs.countryCode ? (
              <img
                src={flagUrl}
                alt={inputs.countryCode}
                crossOrigin="anonymous"
                style={{ height: 22 }}
                className="object-cover rounded-md select-none"
                draggable={false}
              />
            ) : null}
            <span style={{ letterSpacing: 0.2 }} className="truncate">
              {inputs.username}
            </span>
          </div>
        </div>
      );
    };
  };
}
