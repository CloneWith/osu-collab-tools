import React, { useEffect, useState } from "react";
import type { AvatarInputs, IAvatarStyle } from "./IAvatarStyle";
import { FlagTheme, getCountryFlagDataUrl, getProxiedImageUrl } from "@/lib/utils";
import flagFallback from "@/public/flag-fallback.png";

export class ModernAvatarStyle implements IAvatarStyle {
  name = "现代";
  description = "目前的 osu! 论坛使用的用户头像样式。";
  size = {width: 300, height: 300};
  defaultFont = {family: "Torus", size: 40, weight: "500"};

  generateAvatar = (inputs: AvatarInputs): React.FC => {
    const {width, height} = this.size;
    const font = inputs.font ?? this.defaultFont;

    return () => {
      const [flagUrl, setFlagUrl] = useState(flagFallback.src);

      useEffect(() => {
        if (inputs.countryCode) {
          getCountryFlagDataUrl(inputs.countryCode, FlagTheme.Twemoji).then((url) => {
            setFlagUrl(url);
          });
        }
      }, [inputs.countryCode]);

      return (
        <div
          style={{
            width: "460px",
            backgroundColor: "#2a2226",
          }}
          className="flex flex-col items-center"
        >
          <img
            src={getProxiedImageUrl(inputs.imageUrl)}
            alt={inputs.username}
            crossOrigin="anonymous"
            draggable={false}
            style={{
              width,
              height,
            }}
            className="mt-8 rounded-2xl object-cover select-none"
          />

          <div
            style={{
              fontFamily: font.family,
              fontWeight: font.weight,
              fontSize: font.size,
            }}
            className="text-white"
          >
            {inputs.username}
          </div>

          {inputs.countryCode ? (
            <img
              src={flagUrl}
              alt={inputs.countryCode}
              crossOrigin="anonymous"
              draggable={false}
              style={{height: 72}}
              className="mt-2 mb-5 object-cover rounded-md select-none"
            />
          ) : null}
        </div>
      );
    };
  };
}
