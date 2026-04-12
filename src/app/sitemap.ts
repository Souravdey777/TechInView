import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getProblems, getPublicProfileUsernames } from "@/lib/db/queries";
import { getPublicProfilePath } from "@/lib/public-profile";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";
  const posts = getAllPosts();

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updated ?? p.date),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  // Practice problem pages
  const problems = await getProblems();
  const practiceEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/practice`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...problems.map((p) => ({
      url: `${baseUrl}/practice/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  let publicProfileUsernames: string[] = [];

  try {
    publicProfileUsernames = await getPublicProfileUsernames();
  } catch {
    publicProfileUsernames = [];
  }

  const publicProfileEntries: MetadataRoute.Sitemap = publicProfileUsernames.map((username) => ({
    url: `${baseUrl}${getPublicProfilePath(username)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/how-ai-evaluates`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...blogEntries,
    ...practiceEntries,
    ...publicProfileEntries,
  ];
}
