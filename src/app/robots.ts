import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-seo";

/**
 * Keep crawlers on the public marketing surface. Prefixes match without a
 * trailing slash so the bare route is covered too ("/interview" also covers
 * "/interviews/..."). Login/signup stay crawlable so a noindex on those pages
 * can be seen.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/callback",
          "/onboarding",
          "/dashboard",
          "/settings",
          "/progress",
          "/problems",
          "/prep-plans",
          "/prep-guru",
          "/design-system",
          "/orb-lab",
          "/interview",
          "/results",
          "/practice/solve/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
