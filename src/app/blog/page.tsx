import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Rss } from "lucide-react";
import { buildBlogIndexJsonLd, DEFAULT_OG_IMAGE_PATH } from "@/lib/blog-seo";
import { getAllPosts } from "@/lib/blog";
import { BLOG_START_HERE, getTopicCounts } from "@/lib/blog-taxonomy";
import { BlogArchive } from "@/components/blog/BlogArchive";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

export const metadata: Metadata = {
  title: "Interview Prep Blog — Coding & FAANG Guides | TechInView",
  description:
    "Long-form guides on coding interview communication, DSA, Two Sum–style walkthroughs, FAANG scoring, time complexity, AI mock interviews, resume ATS, and system design prep.",
  keywords: [
    "coding interview blog",
    "leetcode interview prep",
    "FAANG interview tips",
    "mock interview practice",
    "software engineer interview",
    "TechInView",
  ],
  authors: [{ name: "TechInView", url: baseUrl }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Interview Prep Blog — TechInView",
    description:
      "DSA, communication, FAANG-style scoring, complexity, AI mocks, behavioral prep, and more—practical guides for software engineers.",
    type: "website",
    url: `${baseUrl}/blog`,
    siteName: "TechInView",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "TechInView — Interview prep blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Prep Blog — TechInView",
    description:
      "Practical coding interview guides: DSA, communication, FAANG prep, and AI mock interviews.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
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
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(indexJsonLd) }}
      />

      {/* ── Header ── */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-brand-cyan">
            Interview prep
          </p>
          <h1 className="mb-4 flex flex-wrap items-baseline gap-1 font-heading text-4xl font-bold text-brand-text sm:text-5xl">
            <span>Blog</span>
            <span
              className="text-[2.5rem] leading-none text-brand-cyan sm:text-[3rem]"
              aria-hidden
            >
              .
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-brand-muted">
            Deep dives on communication, algorithms, what interviewers measure,
            and how to practice effectively—written for engineers shipping real
            prep, not generic listicles.
          </p>
        </div>

        <dl className="flex shrink-0 gap-8 sm:pb-2">
          <div>
            <dd className="m-0 text-3xl font-bold tracking-tight text-brand-text">
              {posts.length}
            </dd>
            <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-muted">
              Guides
            </dt>
          </div>
          <div>
            <dd className="m-0 text-3xl font-bold tracking-tight text-brand-text">
              {totalTopics}
            </dd>
            <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-muted">
              Topics
            </dt>
          </div>
          <div>
            <dd className="m-0">
              <a
                href="/blog/rss.xml"
                className="inline-flex items-center gap-2 text-brand-cyan hover:underline"
              >
                <Rss className="h-4 w-4 shrink-0" aria-hidden />
                <span className="font-mono text-sm">RSS</span>
              </a>
            </dd>
            <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-muted">
              Subscribe
            </dt>
          </div>
        </dl>
      </div>

      {/* ── Featured ── */}
      {featured ? (
        <Link
          href={`/blog/${featured.slug}`}
          className="landing-panel group mt-12 grid grid-cols-1 gap-10 p-7 transition-colors hover:border-brand-cyan/30 sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        >
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-cyan">
                Latest
              </span>
              <span className="font-mono text-[11px] tracking-wide text-brand-muted">
                {formatDate(featured.date)}
              </span>
              <span className="h-3 w-px bg-brand-border" aria-hidden />
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-brand-muted">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {featured.readingTimeMinutes} min read
              </span>
            </div>

            <h2 className="mt-6 font-heading text-2xl font-bold leading-tight tracking-tight text-brand-text transition-colors group-hover:text-brand-cyan sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-brand-muted">
              {featured.description}
            </p>
            <span className="mt-7 inline-flex items-center gap-2 font-medium text-brand-cyan">
              Read article
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
            <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">
              Topic
            </p>
            <p className="mt-3 text-lg font-semibold text-brand-text">
              {featured.topic}
            </p>
            {featured.tags?.length ? (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-border pt-5">
                {featured.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-brand-border px-2.5 py-1 font-mono text-[11px] text-brand-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      ) : null}

      {/* ── Archive + sidebar ── */}
      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <BlogArchive posts={rest} topics={archiveTopics} />

        <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
          {startHere.length > 0 ? (
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">
                Start here
              </p>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                If you only read three, read these in order.
              </p>
              <ol className="m-0 mt-5 list-none p-0">
                {startHere.map((post, i) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex gap-3.5 border-t border-brand-border py-4 transition-colors hover:text-brand-cyan"
                    >
                      <span className="shrink-0 font-mono text-[11px] text-brand-cyan">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium leading-snug text-brand-text transition-colors hover:text-brand-cyan">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="landing-panel p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-sm shadow-brand-cyan/50"
                aria-hidden
              />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-cyan">
                Practice, not just reading
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold leading-snug text-brand-text">
              Every guide here is something you can go and rehearse out loud.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              Free practice on the curated DSA set, plus one 5-minute audio
              round so you can hear what the clock does to you.
            </p>
            <Link
              href="/signup?next=/interview/setup"
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-cyan font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
            >
              Practice Free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
