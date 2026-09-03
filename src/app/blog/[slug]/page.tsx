import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { mdxComponents } from "@/components/blog/mdx-components";
import {
  buildBlogPostingAndBreadcrumbJsonLd,
  wordCountFromMarkdownBody,
} from "@/lib/blog-seo";
import { getAllPosts, getPostBySlug, getPostSlugs } from "@/lib/blog";
import { extractHeadings } from "@/lib/blog-taxonomy";
import { PostToc } from "@/components/blog/PostToc";
import { RelatedProblems } from "@/components/blog/RelatedProblems";

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
    month: "long",
    day: "numeric",
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
    title: `${post.title} — TechInView Blog`,
    description: post.description,
    keywords,
    authors: [{ name: "TechInView", url: baseUrl }],
    category: "Interview preparation",
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      url,
      siteName: "TechInView",
      locale: "en_US",
      // OG image auto-discovered from co-located opengraph-image.tsx
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      // Twitter image auto-discovered from co-located opengraph-image.tsx
    },
    alternates: { canonical: `/blog/${post.slug}` },
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
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All posts
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
        <article className="min-w-0">
          <header className="border-b border-brand-border pb-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] tracking-wide text-brand-muted">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <span className="h-3 w-px bg-brand-border" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {post.readingTimeMinutes} min read
              </span>
              <span className="h-3 w-px bg-brand-border" aria-hidden />
              <span className="text-brand-cyan">{post.topic}</span>
            </div>

            <h1 className="mt-6 font-heading text-3xl font-bold leading-tight tracking-tight text-brand-text sm:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-muted">
              {post.description}
            </p>

            {post.tags?.length ? (
              <ul className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-lg border border-brand-border px-2.5 py-1 font-mono text-[11px] text-brand-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div
            className="
              prose prose-invert prose-lg mt-10 max-w-none
              prose-headings:font-heading prose-headings:text-brand-text prose-headings:scroll-mt-24
              prose-p:text-brand-muted prose-p:leading-relaxed
              prose-strong:text-brand-text prose-strong:font-semibold
              prose-a:text-brand-cyan prose-a:no-underline hover:prose-a:underline
              prose-li:text-brand-muted prose-li:marker:text-brand-cyan
              prose-blockquote:border-brand-cyan/40 prose-blockquote:text-brand-muted
              prose-code:text-brand-cyan prose-code:bg-brand-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-brand-surface prose-pre:border prose-pre:border-brand-border prose-pre:rounded-xl
              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none
              prose-hr:border-brand-border
              prose-table:text-sm
              prose-th:text-brand-text prose-td:text-brand-muted
            "
          >
            {content}
          </div>

          <RelatedProblems keyword={post.keyword} />
        </article>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
          <PostToc headings={headings} />

          <div className="landing-panel p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-sm shadow-brand-cyan/50"
                aria-hidden
              />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-cyan">
                Practice out loud
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold leading-snug text-brand-text">
              Reading this is the easy half.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              Start with free DSA practice, then switch into a voice mock
              interview with live coding and a scored breakdown when you want
              the full simulation.
            </p>
            <Link
              href="/signup?next=/interview/setup"
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-cyan font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
            >
              Practice free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {related.length > 0 ? (
            <nav
              aria-label="Related posts"
              className="rounded-2xl border border-brand-border bg-brand-surface p-6"
            >
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">
                Related
              </p>
              <ul className="m-0 mt-4 list-none p-0">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="group flex flex-col gap-1.5 border-t border-brand-border py-4"
                    >
                      <span className="text-sm font-medium leading-snug text-brand-text transition-colors group-hover:text-brand-cyan">
                        {p.title}
                      </span>
                      <span className="font-mono text-[10px] tracking-wide text-brand-subtle">
                        {p.topic} &middot; {p.readingTimeMinutes} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
