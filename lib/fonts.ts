import localFont from "next/font/local";

export const torus = localFont({
    src: [
        {
            path: "../public/fonts/torus-regular.otf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/fonts/torus-semibold.otf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../public/fonts/torus-bold.otf",
            weight: "700",
            style: "normal",
        },
    ],
});
