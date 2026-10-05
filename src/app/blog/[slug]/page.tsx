import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/blog/mdx-components";
import {
  SITE_NAME,
  buildBlogPostingAndBreadcrumbJsonLd,
  serializeJsonLd,
  wordCountFromMarkdownBody,
} from "@/lib/blog-seo";
import { getAllPosts, getPostBySlug, getPostSlugs } from "@/lib/blog";
import { extractFaq, extractHeadings } from "@/lib/blog-taxonomy";
import { PostToc } from "@/components/blog/PostToc";
import { RelatedProblems } from "@/components/blog/RelatedProblems";
import {
  BODY,
  ButtonLink,
  CELL,
  CHIP,
  CONTAINER,
  Eyebrow,
  GRID,
  H2,
  HAIRLINE,
  Kicker,
  LABEL,
  LEAD,
  PAD,
  PROSE,
} from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type BlogPostPageProps = {
  params: { slug: string };
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

function buildPostKeywords(post: {
  keyword: string;
  tags?: string[];
}): string[] {
  const raw = [
    ...(post.tags ?? []),
    post.keyword,
    "coding interview",
    "TechInView",
  ];
  const seen = new Set<string>();
  return raw.filter((k) => {
    const t = k.trim();
    if (!t || seen.has(t.toLowerCase())) return false;
    seen.add(t.toLowerCase());
    return true;
  });
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export const revalidate = 3600;

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: "Post not found" };
  }
  const url = `${baseUrl}/blog/${post.slug}`;
  const keywords = buildPostKeywords(post);

  return {
    // Long, reader-facing titles get truncated in search; seoTitle is the
    // trimmed version when a post supplies one.
    title: post.seoTitle ?? `${post.title} | ${SITE_NAME}`,
    description: post.description,
    keywords,
    authors: [{ name: SITE_NAME, url: baseUrl }],
    category: "Interview preparation",
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [SITE_NAME],
      section: post.topic,
      tags: post.tags,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      // OG image auto-discovered from co-located opengraph-image.tsx
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      // Twitter image auto-discovered from co-located opengraph-image.tsx
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.body,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  const allPosts = getAllPosts();
  const headings = extractHeadings(post.body);
  const faq = extractFaq(post.body);

  // same topic first, then most recent, so "related" means something
  const related = [
    ...allPosts.filter((p) => p.slug !== post.slug && p.topic === post.topic),
    ...allPosts.filter((p) => p.slug !== post.slug && p.topic !== post.topic),
  ].slice(0, 3);

  const keywords = buildPostKeywords(post);
  const wordCount = wordCountFromMarkdownBody(post.body);
  const jsonLd = buildBlogPostingAndBreadcrumbJsonLd({
    baseUrl,
    slug: post.slug,
    title: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    keywords,
    wordCount,
    readingTimeMinutes: post.readingTimeMinutes,
    faq,
  });

  return (
    <div className="overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <article>
        <header className={cn("pb-12 pt-16 sm:pt-24", PAD)}>
          <div className={CONTAINER}>
            <nav aria-label="Breadcrumb">
              <ol className={cn(LABEL, "m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0")}>
                <li>
                  <Link href="/" className="transition-colors hover:text-brand-cyan">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/blog" className="transition-colors hover:text-brand-cyan">
                    Blog
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li
                  aria-current="page"
                  className="min-w-0 max-w-full truncate text-brand-muted sm:max-w-md"
                >
                  {post.title}
                </li>
              </ol>
            </nav>

            <Kicker className="mb-6 mt-14">{post.topic}</Kicker>
            <h1 className={cn(H2, "max-w-[22ch]")}>{post.title}</h1>
            <p className={cn(LEAD, "mt-8 max-w-[640px]")}>{post.description}</p>

            <div
              className={cn(
                "mt-12 flex flex-wrap gap-x-8 gap-y-2 border-t pt-5 font-mono text-xs uppercase tracking-[0.06em] text-brand-muted",
                HAIRLINE
              )}
            >
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updated && post.updated !== post.date ? (
                <span>
                  Updated{" "}
                  <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </span>
              ) : null}
              <span>By {SITE_NAME}</span>
              <span>{post.readingTimeMinutes} min read</span>
            </div>

            {post.tags?.length ? (
              <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0">
                {post.tags.map((tag) => (
                  <li key={tag} className={CHIP}>
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        <div className={cn("pb-24", PAD)}>
          <div
            className={cn(
              CONTAINER,
              "grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,720px)_260px] lg:justify-between lg:gap-20"
            )}
          >
            <div className="min-w-0">
              <div
                className={cn(
                  PROSE,
                  "prose-headings:scroll-mt-24 prose-li:marker:text-brand-subtle [&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0"
                )}
              >
                {content}
              </div>

              <RelatedProblems keyword={post.keyword} />
            </div>

            {headings.length > 0 ? (
              <aside className="hidden lg:sticky lg:block lg:top-24 lg:self-start">
                <PostToc headings={headings} />
              </aside>
            ) : null}
          </div>
        </div>
      </article>

      {/* ── Practice CTA ── */}
      <section className={cn("py-24", PAD)}>
        <div className={cn(CONTAINER, "border-t pt-16", HAIRLINE)}>
          <Kicker>Practice out loud</Kicker>
          <h2 className={cn(H2, "max-w-[16ch]")}>
            Reading this is{" "}
            <span className="text-brand-subtle">the easy half.</span>
          </h2>
          <p className={cn(BODY, "mt-6 max-w-[460px]")}>
            Start with free DSA practice, then switch into a voice mock
            interview with live coding and a scored breakdown when you want the
            full simulation.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/signup?next=/interview/setup">
              Practice free <span className="font-mono">→</span>
            </ButtonLink>
            <ButtonLink href="/practice" variant="ghost">
              Browse problems
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Related guides ── */}
      {related.length > 0 ? (
        <nav aria-label="Related posts" className={cn("pb-[120px]", PAD)}>
          <div className={CONTAINER}>
            <Eyebrow>Related guides</Eyebrow>
            <ul className={cn(GRID, "m-0 list-none grid-cols-1 p-0 md:grid-cols-3")}>
              {related.map((p) => (
                <li key={p.slug} className={cn(CELL, "min-w-0")}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex h-full flex-col gap-6 p-6 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan sm:p-7"
                  >
                    <span className={LABEL}>
                      {p.topic} · {p.readingTimeMinutes} min
                    </span>
                    <span className="text-xl font-normal leading-snug tracking-[-0.02em] text-brand-text transition-colors group-hover:text-brand-cyan">
                      {p.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
