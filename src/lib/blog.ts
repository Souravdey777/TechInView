import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  keyword: string;
  /** ISO date if the post was materially updated (SEO: dateModified, OG) */
  updated?: string;
  /** Secondary keywords / topics for meta keywords and discovery */
  tags?: string[];
};

export type BlogListItem = BlogFrontmatter & {
  slug: string;
  readingTimeMinutes: number;
};

export type BlogPost = BlogListItem & {
  body: string;
};

function readingMinutesFromContent(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const fm = data as BlogFrontmatter;
  if (!fm.title || !fm.description || !fm.date || !fm.keyword) {
    return null;
  }
  const tags = Array.isArray(fm.tags)
    ? fm.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
    : undefined;
  const updated =
    typeof fm.updated === "string" && fm.updated.length > 0
      ? fm.updated
      : undefined;
  return {
    ...fm,
    tags,
    updated,
    slug,
    body: content,
    readingTimeMinutes: readingMinutesFromContent(content),
  };
}

export function getAllPosts(): BlogListItem[] {
  return getPostSlugs()
    .map((slug) => {
      const post = getPostBySlug(slug);
      if (!post) return null;
      const { body: _b, ...list } = post;
      return list;
    })
    .filter((x): x is BlogListItem => x !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
