import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, Tag } from "lucide-react";
import { mdxComponents } from "@/components/blog/mdx-components";
import {
  buildBlogPostingAndBreadcrumbJsonLd,
  wordCountFromMarkdownBody,
} from "@/lib/blog-seo";
import { getAllPosts, getPostBySlug, getPostSlugs } from "@/lib/blog";
import { RelatedProblems } from "@/components/blog/RelatedProblems";

type BlogPostPageProps = {
  params: { slug: string };
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.ai";

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

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

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
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/blog"
        className="text-sm text-brand-muted hover:text-brand-cyan transition-colors mb-8 inline-block"
      >
        ← All posts
      </Link>

      <header className="mb-10 pb-10 border-b border-brand-border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-muted mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            {post.readingTimeMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1.5 text-brand-cyan/90">
            <Tag className="w-3.5 h-3.5" aria-hidden />
            {post.keyword}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-text leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-brand-muted leading-relaxed">
          {post.description}
        </p>
      </header>

      <div
        className="
          prose prose-invert prose-lg max-w-none
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

      <aside className="mt-16 pt-10 border-t border-brand-border">
        <p className="text-sm font-semibold text-brand-text mb-4">
          Practice out loud with an AI interviewer
        </p>
        <p className="text-sm text-brand-muted mb-6 leading-relaxed">
          TechInView runs full voice mock interviews with live coding and
          structured feedback—so you train communication and problem solving
          together, not just syntax.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
        >
          Start a free interview
        </Link>
      </aside>

      <RelatedProblems keyword={post.keyword} />

      {related.length > 0 ? (
        <nav className="mt-14" aria-label="Related posts">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            More on the blog
          </h2>
          <ul className="space-y-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-brand-cyan hover:underline text-sm font-medium"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
