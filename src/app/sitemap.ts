import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getProblems, getPublicProfileUsernames } from "@/lib/db/queries";
import { LEGAL_LAST_UPDATED_ISO, LEGAL_LINKS } from "@/lib/legal";
import { getPublicProfilePath } from "@/lib/public-profile";
import { getSiteUrl } from "@/lib/site-seo";

export const revalidate = 3600;

// Auth pages (/login, /signup) and everything behind auth are left out on
// purpose. lastModified is only set where a real date exists; a "now"
// timestamp on every build teaches crawlers to ignore lastmod entirely.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const posts = getAllPosts();
  const latestPostDate = posts[0]
    ? new Date(posts[0].updated ?? posts[0].date)
    : undefined;

  // A DB outage should drop these sections, not 500 the whole sitemap.
  const [problems, usernames] = await Promise.all([
    getProblems().catch(() => []),
    getPublicProfileUsernames().catch(() => [] as string[]),
  ]);

  const coreEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/practice`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-ai-evaluates`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const practiceEntries: MetadataRoute.Sitemap = problems.map((p) => ({
    url: `${baseUrl}/practice/${p.slug}`,
    // unstable_cache serialises Dates to strings, so normalise.
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const legalEntries: MetadataRoute.Sitemap = LEGAL_LINKS.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: new Date(LEGAL_LAST_UPDATED_ISO),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  // Opt-in public profiles only (is_public_profile = true).
  const profileEntries: MetadataRoute.Sitemap = usernames.map((username) => ({
    url: `${baseUrl}${getPublicProfilePath(username)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [
    ...coreEntries,
    ...practiceEntries,
    ...blogEntries,
    ...legalEntries,
    ...profileEntries,
  ];
}
