import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/blog-seo";
import { SITE_DEFAULT_DESCRIPTION, SITE_THEME_COLOR } from "@/lib/site-seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: AI Mock Interviews`,
    short_name: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: SITE_THEME_COLOR,
    theme_color: SITE_THEME_COLOR,
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
