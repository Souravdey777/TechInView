import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/settings/",
          "/progress/",
          "/problems/",
          "/interview/",
          "/results/",
          "/onboarding/",
          "/api/",
          "/callback/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
