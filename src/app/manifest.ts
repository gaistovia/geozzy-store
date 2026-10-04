import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GEOZZY STORE",
    short_name: "GEOZZY",
    description: "Viatu • Saa Kali. Nunua online Tanzania, agiza kupitia WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#0b0a05",
    lang: "sw",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
