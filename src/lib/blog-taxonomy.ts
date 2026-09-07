/**
 * Pure blog taxonomy and list helpers.
 *
 * Kept separate from `@/lib/blog` because that module reads the filesystem,
 * and these values are needed by client components (the index topic filter).
 */

/**
 * Reader-facing topics for the blog index filter, in display order.
 * Deliberately separate from `keyword`/`tags`, which are long-tail SEO
 * strings and unique per post.
 */
export const BLOG_TOPICS = [
  "Prep planning",
  "Coding craft",
  "What gets scored",
  "Process & materials",
  "Fundamentals",
  "System design",
] as const;

export type BlogTopic = (typeof BLOG_TOPICS)[number];

const DEFAULT_BLOG_TOPIC: BlogTopic = "Coding craft";

const BLOG_TOPIC_SET = new Set<string>(BLOG_TOPICS);

export function normalizeTopic(value: unknown): BlogTopic {
  return typeof value === "string" && BLOG_TOPIC_SET.has(value)
    ? (value as BlogTopic)
    : DEFAULT_BLOG_TOPIC;
}

/** Ordered reading path surfaced in the index sidebar. */
export const BLOG_START_HERE: readonly string[] = [
  "faang-interview-scoring",
  "coding-interview-communication",
  "90-day-coding-interview-prep-plan",
];

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  keyword: string;
  /**
   * Short `<title>` for search results. The on-page `title` is written for
   * readers and runs long; Google truncates around 60 characters, so this is
   * the trimmed, keyword-first version used for metadata only.
   */
  seoTitle?: string;
  /** Reader-facing topic used by the blog index filter */
  topic?: BlogTopic;
  /** ISO date if the post was materially updated (SEO: dateModified, OG) */
  updated?: string;
  /** Secondary keywords / topics for meta keywords and discovery */
  tags?: string[];
};

export type BlogFaqEntry = {
  question: string;
  answer: string;
};

export type BlogListItem = Omit<BlogFrontmatter, "topic"> & {
  slug: string;
  readingTimeMinutes: number;
  topic: BlogTopic;
};

export type BlogMonthGroup = {
  /** e.g. "2026-04", stable for React keys */
  key: string;
  /** e.g. "April 2026" */
  label: string;
  posts: BlogListItem[];
};

/** Groups an already date-sorted list into descending month buckets. */
export function groupPostsByMonth(posts: BlogListItem[]): BlogMonthGroup[] {
  const groups: BlogMonthGroup[] = [];

  for (const post of posts) {
    const date = new Date(post.date);
    const key = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.posts.push(post);
      continue;
    }

    groups.push({
      key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
      posts: [post],
    });
  }

  return groups;
}

/** Post count per topic, in BLOG_TOPICS order, omitting empty topics. */
export function getTopicCounts(
  posts: BlogListItem[]
): { topic: BlogTopic; count: number }[] {
  return BLOG_TOPICS.map((topic) => ({
    topic,
    count: posts.filter((p) => p.topic === topic).length,
  })).filter((t) => t.count > 0);
}

export type BlogHeading = {
  /** Anchor id, matching what mdx-components renders on the heading */
  id: string;
  text: string;
  level: 2 | 3;
};

/** Strips the inline markdown that can appear inside a heading. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Heading -> anchor id. Used by BOTH the table of contents and the rendered
 * headings in mdx-components, so the two always agree. Deliberately does not
 * de-duplicate: the MDX component cannot see sibling headings, so a repeated
 * heading within one post would anchor to the first occurrence.
 */
export function slugifyHeading(text: string): string {
  return stripInlineMarkdown(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u201a\u201b]/g, "")
    .replace(/[\u201c\u201d\u201e\u201f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Pulls h2/h3 headings out of raw MDX, ignoring fenced code blocks. */
export function extractHeadings(body: string): BlogHeading[] {
  const headings: BlogHeading[] = [];
  let inFence = false;

  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = stripInlineMarkdown(match[2]);
    const id = slugifyHeading(match[2]);
    if (!id) continue;

    headings.push({ id, text, level: match[1].length === 2 ? 2 : 3 });
  }

  return headings;
}

/**
 * Markdown -> the plain text schema.org expects in an Answer.
 *
 * Block markers have to be stripped per line, before the lines are joined:
 * once joined, `^`-anchored rules only match the first line.
 */
function markdownToPlainText(markdown: string): string {
  const text = markdown
    .split("\n")
    // Tables carry no meaning once flattened to a sentence.
    .filter((line) => !/^\s*\|/.test(line))
    .map((line) =>
      line
        .replace(/^\s*>\s?/, "")
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
    )
    .join(" ");

  return stripInlineMarkdown(text).replace(/\s+/g, " ").trim();
}

/** Headings that open an FAQ section, however the author phrased it. */
const FAQ_HEADING = /^(faqs?|frequently asked questions)\b/i;

/**
 * Pulls the `## FAQ` section's `### question` + answer pairs out of raw MDX.
 * The pairs are already rendered on the page, which is what makes them
 * legitimate FAQPage markup rather than hidden content.
 */
export function extractFaq(body: string): BlogFaqEntry[] {
  const entries: BlogFaqEntry[] = [];
  let inFaqSection = false;
  let inFence = false;
  let question: string | null = null;
  let answerLines: string[] = [];

  const flush = () => {
    if (!question) return;
    const answer = markdownToPlainText(answerLines.join("\n"));
    if (answer) entries.push({ question, answer });
    question = null;
    answerLines = [];
  };

  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (h2) {
      flush();
      inFaqSection = FAQ_HEADING.test(stripInlineMarkdown(h2[1]));
      continue;
    }
    if (!inFaqSection) continue;

    const h3 = /^###\s+(.+?)\s*#*\s*$/.exec(line);
    if (h3) {
      flush();
      question = stripInlineMarkdown(h3[1]);
      continue;
    }

    // A horizontal rule ends the FAQ block in these posts (the summary follows).
    if (/^\s*---\s*$/.test(line)) {
      flush();
      inFaqSection = false;
      continue;
    }

    if (question) answerLines.push(line);
  }

  flush();
  return entries;
}
