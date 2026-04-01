import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, Tag } from "lucide-react";
import { buildBlogIndexJsonLd, DEFAULT_OG_IMAGE_PATH } from "@/lib/blog-seo";
import { getAllPosts } from "@/lib/blog";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.ai";

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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(indexJsonLd) }}
      />
      <p className="text-sm font-semibold text-brand-cyan tracking-wide uppercase mb-3">
        Interview prep
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-text mb-4 flex items-baseline gap-1 flex-wrap">
        <span>Blog</span>
        <span className="text-brand-cyan text-[2.25rem] sm:text-[2.75rem] leading-none" aria-hidden>
          .
        </span>
      </h1>
      <p className="text-brand-muted text-lg leading-relaxed mb-12 max-w-2xl">
        Deep dives on communication, algorithms, what interviewers measure, and
        how to practice effectively—written for engineers shipping real prep,
        not generic listicles.
      </p>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none p-0 m-0">
        {posts.map((post) => (
          <li key={post.slug} className="min-w-0">
            <Link
              href={`/blog/${post.slug}`}
              className="group flex h-full min-h-[220px] flex-col glass-card p-6 sm:p-7 transition-all hover:border-brand-cyan/30 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-muted mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {formatDate(post.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {post.readingTimeMinutes} min read
                </span>
                <span className="inline-flex items-center gap-1.5 text-brand-cyan/90">
                  <Tag className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {post.keyword}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-brand-text group-hover:text-brand-cyan transition-colors mb-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed line-clamp-4 flex-1">
                {post.description}
              </p>
              <span className="inline-block mt-4 text-sm font-medium text-brand-cyan group-hover:underline">
                Read article →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
