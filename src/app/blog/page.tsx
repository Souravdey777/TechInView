import type { Metadata } from "next";
import Link from "next/link";
import {
  buildBlogIndexJsonLd,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
} from "@/lib/blog-seo";
import { getAllPosts } from "@/lib/blog";
import { BLOG_START_HERE, getTopicCounts } from "@/lib/blog-taxonomy";
import { BlogArchive } from "@/components/blog/BlogArchive";
import {
  BODY,
  ButtonLink,
  CHIP,
  CONTAINER,
  Eyebrow,
  H1,
  HAIRLINE,
  Kicker,
  LABEL,
  LEAD,
  LINK_ARROW,
  PAD,
} from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

export const metadata: Metadata = {
  title: "Coding Interview Prep Blog: DSA & FAANG Guides | TechInView",
  description:
    "Practical guides for software engineer interviews: thinking out loud, DSA patterns, FAANG scoring, time complexity, behavioral and EM rounds, and mock interviews.",
  keywords: [
    "coding interview blog",
    "leetcode interview prep",
    "FAANG interview tips",
    "mock interview practice",
    "software engineer interview",
    "TechInView",
  ],
  authors: [{ name: SITE_NAME, url: baseUrl }],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    title: "Coding Interview Prep Blog | TechInView",
    description:
      "Practical guides for software engineer interviews: DSA, communication, FAANG-style scoring, complexity, behavioral rounds, and mock interviews.",
    type: "website",
    url: `${baseUrl}/blog`,
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "TechInView interview prep blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coding Interview Prep Blog | TechInView",
    description:
      "Practical coding interview guides: DSA, communication, FAANG prep, and AI mock interviews.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const indexJsonLd = buildBlogIndexJsonLd({
    baseUrl,
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.date,
    })),
  });

  const [featured, ...rest] = posts;
  // Chip counts must describe the archive, which excludes the featured post,
  // or a chip promises more results than clicking it returns.
  const archiveTopics = getTopicCounts(rest);
  const totalTopics = getTopicCounts(posts).length;
  const startHere = BLOG_START_HERE.map((slug) =>
    posts.find((p) => p.slug === slug)
  ).filter((p): p is (typeof posts)[number] => Boolean(p));

  return (
    <div className="overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(indexJsonLd) }}
      />

      {/* ── Hero ── */}
      <header className={cn("pb-16 pt-20 sm:pt-28", PAD)}>
        <div className={CONTAINER}>
          <Kicker>Interview prep blog</Kicker>
          <h1 className={cn(H1, "max-w-[14ch]")}>
            Guides for the round,{" "}
            <span className="text-brand-subtle">not just the problem.</span>
          </h1>
          <p className={cn(LEAD, "mt-10 max-w-[560px]")}>
            Guides on communication, algorithms, what interviewers measure,
            and how to practice, written for engineers preparing for real
            interview loops.
          </p>
          <div
            className={cn(
              "mt-14 flex flex-wrap items-center gap-x-10 gap-y-3 border-t pt-5 font-mono text-xs uppercase tracking-[0.06em] text-brand-muted",
              HAIRLINE
            )}
          >
            <span>
              <span className="text-brand-text">{posts.length}</span> guides
            </span>
            <span>
              <span className="text-brand-text">{totalTopics}</span> topics
            </span>
            <a href="/blog/rss.xml" className={LINK_ARROW}>
              RSS feed <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <section className={cn("pb-[120px]", PAD)}>
          <div className={cn(CONTAINER, "border-t pt-10", HAIRLINE)}>
            <p className={BODY}>
              No guides published yet. Check back soon, or subscribe to the
              RSS feed.
            </p>
          </div>
        </section>
      ) : null}

      {/* ── 01 Latest ── */}
      {featured ? (
        <section className={cn("pb-24", PAD)}>
          <div className={CONTAINER}>
            <Eyebrow n="01">Latest</Eyebrow>
            <Link
              href={`/blog/${featured.slug}`}
              className={cn(
                "group grid grid-cols-1 gap-10 border-y py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16",
                HAIRLINE,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
              )}
            >
              <div className="min-w-0">
                <h2 className="text-balance text-[clamp(28px,3.6vw,48px)] font-normal leading-[1.05] tracking-[-0.035em] transition-colors group-hover:text-brand-cyan">
                  {featured.title}
                </h2>
                <p className={cn(LEAD, "mt-6 max-w-[560px]")}>
                  {featured.description}
                </p>
                <span className={cn(LINK_ARROW, "mt-8")}>
                  Read the guide <span aria-hidden>→</span>
                </span>
              </div>

              <dl className="m-0 grid grid-cols-2 content-start gap-x-6 gap-y-6 lg:border-l lg:border-white/[0.08] lg:pl-10">
                <div>
                  <dt className={LABEL}>Published</dt>
                  <dd className="m-0 mt-2 font-mono text-sm text-brand-text">
                    <time dateTime={featured.date}>
                      {formatDate(featured.date)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className={LABEL}>Read time</dt>
                  <dd className="m-0 mt-2 font-mono text-sm text-brand-text">
                    {featured.readingTimeMinutes} min
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className={LABEL}>Topic</dt>
                  <dd className="m-0 mt-2 text-[15px] text-brand-text">
                    {featured.topic}
                  </dd>
                </div>
                {featured.tags?.length ? (
                  <div className="col-span-2">
                    <dt className="sr-only">Tags</dt>
                    <dd className="m-0 flex flex-wrap gap-2">
                      {featured.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className={CHIP}>
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── 02 Archive + 03 Start here ── */}
      {posts.length > 0 ? (
        <section className={cn("pb-[120px]", PAD)}>
          <div
            className={cn(
              CONTAINER,
              "grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20"
            )}
          >
            <div className="min-w-0">
              <Eyebrow n="02">All guides</Eyebrow>
              {rest.length > 0 ? (
                <BlogArchive posts={rest} topics={archiveTopics} />
              ) : (
                <p className={cn(BODY, "border-t pt-6", HAIRLINE)}>
                  The latest guide is the only one so far. More are on the
                  way.
                </p>
              )}
            </div>

            <aside className="flex min-w-0 flex-col gap-14 lg:sticky lg:top-24 lg:self-start">
              {startHere.length > 0 ? (
                <div>
                  <Eyebrow n="03">Start here</Eyebrow>
                  <p className={BODY}>
                    If you only read three, read these in order.
                  </p>
                  <ol className={cn("m-0 mt-6 list-none border-b p-0", HAIRLINE)}>
                    {startHere.map((post, i) => (
                      <li key={post.slug}>
                        <Link
                          href={`/blog/${post.slug}`}
                          className={cn(
                            "group flex gap-4 border-t py-5",
                            HAIRLINE
                          )}
                        >
                          <span className="shrink-0 font-mono text-xs text-brand-cyan">
                            /{String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[15px] leading-snug text-brand-text transition-colors group-hover:text-brand-cyan">
                            {post.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className={cn("border-t pt-8", HAIRLINE)}>
                <div className={LABEL}>Practice, not just reading</div>
                <p className="mt-4 text-xl font-normal leading-snug tracking-[-0.02em] text-brand-text">
                  Every guide here is something you can rehearse out loud.
                </p>
                <p className={cn(BODY, "mt-3")}>
                  Free practice on the curated DSA set, plus one 5-minute
                  audio round so you can hear what the clock does to you.
                </p>
                <ButtonLink
                  href="/signup?next=/interview/setup"
                  size="sm"
                  className="mt-6"
                >
                  Practice free <span className="font-mono">→</span>
                </ButtonLink>
              </div>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}
