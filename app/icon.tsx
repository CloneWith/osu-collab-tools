import { Aperture } from "lucide-react";
import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 128,
  height: 128,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "128px",
        height: "128px",
        backgroundColor: "#4a94e8",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Aperture
        width="96px"
        height="96px"
        style={{
          color: "white",
        }}
      />
    </div>,
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
