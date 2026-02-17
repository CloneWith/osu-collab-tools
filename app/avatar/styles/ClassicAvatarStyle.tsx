import React, { useEffect, useState } from "react";
import type { AvatarInputs, IAvatarStyle } from "./IAvatarStyle";
import { FlagTheme, getCountryFlagDataUrl, getProxiedImageUrl } from "@/lib/utils";
import flagFallback from "@/public/flag-fallback.png";

export class ClassicAvatarStyle implements IAvatarStyle {
  key = "classic";
  size = {width: 320, height: 320};
  defaultFont = {family: "Tahoma", size: 48, weight: "500"};

  generateAvatar = (inputs: AvatarInputs): React.FC => {
    const {width, height} = this.size;
    const font = inputs.font ?? this.defaultFont;

    return () => {
      const [flagUrl, setFlagUrl] = useState(flagFallback.src);

      useEffect(() => {
        if (inputs.countryCode) {
          getCountryFlagDataUrl(inputs.countryCode, FlagTheme.Normal).then(setFlagUrl);
        }
      }, [inputs.countryCode]);

      return (
        <div
          style={{
            width: "460px",
            backgroundColor: "#f0eefb",
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
              boxShadow: "0 0 4px 2px rgba(0, 0, 0, 0.2)",
            }}
            className="mt-8 border-white border-8 object-cover select-none"
          />

          <div
            style={{
              fontFamily: font.family,
              fontWeight: font.weight,
              fontSize: font.size,
            }}
            className="text-black"
          >
            {inputs.username}
          </div>

          {inputs.countryCode && flagUrl ? (
            <img
              src={flagUrl}
              alt={inputs.countryCode}
              crossOrigin="anonymous"
              draggable={false}
              style={{height: 26}}
              className="mt-2 mb-5 object-cover rounded-md select-none"
            />
          ) : null}
        </div>
      );
    };
  };
}
