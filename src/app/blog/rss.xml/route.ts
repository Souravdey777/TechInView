import { getAllPosts } from "@/lib/blog";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";
  const blogUrl = `${baseUrl.replace(/\/$/, "")}/blog`;
  const selfUrl = `${blogUrl}/rss.xml`;
  const posts = getAllPosts().slice(0, 100);

  const items = posts
    .map((p) => {
      const link = `${blogUrl}/${p.slug}`;
      const pub = new Date(p.date).toUTCString();
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechInView Interview Prep Blog</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>Voice-first interview prep: DSA, communication, FAANG-style practice, and AI mock interviews.</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
