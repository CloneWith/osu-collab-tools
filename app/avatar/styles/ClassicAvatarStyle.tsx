import type { ReactElement } from "react";
import { IAvatarStyle, AvatarInputs } from "./IAvatarStyle";
import { getCountryFlagUrl, getProxiedImageUrl } from "@/lib/utils";

export class ClassicAvatarStyle implements IAvatarStyle {
  name = "经典";
  description = "旧版 osu! 论坛使用的头像样式，或许是你最熟悉的...？";
  size = {width: 320, height: 320};
  defaultFont = {family: "Tahoma", size: 48, weight: "500"};

  generateAvatar(inputs: AvatarInputs): ReactElement {
    const {width, height} = this.size;
    const font = inputs.font ?? this.defaultFont;

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
          style={{
            width,
            height,
            boxShadow: "0 0 4px 2px rgba(0, 0, 0, 0.2)"
          }}
          className="mt-8 border-white border-8 object-cover"
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

        {inputs.countryCode ? (
          <img
            src={getProxiedImageUrl(getCountryFlagUrl(inputs.countryCode))}
            alt={inputs.countryCode}
            crossOrigin="anonymous"
            style={{height: 26}}
            className="mt-2 mb-5 object-cover rounded-md"
          />
        ) : null}
      </div>
    );
  }
}
