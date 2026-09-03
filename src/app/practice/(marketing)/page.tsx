import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";
import { getProblems } from "@/lib/db/queries";
import { PracticeGrid } from "@/components/practice/PracticeGrid";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Practice DSA Interview Problems — AI Mock Interviews | TechInView",
  description:
    "Browse 70+ DSA coding interview problems — arrays, trees, graphs, DP, and more. Start with free solo practice, then switch into AI Interview Mode when you want the voice-based simulation.",
  keywords: [
    "DSA interview problems",
    "coding interview practice",
    "leetcode alternative",
    "AI mock interview",
    "FAANG interview prep",
    "two sum practice",
    "data structures and algorithms",
    "TechInView",
  ],
  authors: [{ name: "TechInView", url: baseUrl }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/practice" },
  openGraph: {
    title: "Practice DSA Interview Problems — TechInView",
    description:
      "70+ coding interview problems with free solo practice plus AI Interview Mode. Practice arrays, trees, graphs, DP, and more with voice-powered feedback when you want it.",
    type: "website",
    url: `${baseUrl}/practice`,
    siteName: "TechInView",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TechInView — Practice DSA problems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Practice DSA Interview Problems — TechInView",
    description:
      "70+ coding interview problems with free solo practice plus AI Interview Mode. Voice-powered feedback scored like a real FAANG interview.",
    images: ["/og-image.png"],
  },
};

export default async function PracticePage() {
  const problems = await getProblems();

  const counts = {
    total: problems.length,
    easy: problems.filter((p) => p.difficulty === "easy").length,
    medium: problems.filter((p) => p.difficulty === "medium").length,
    hard: problems.filter((p) => p.difficulty === "hard").length,
  };

  // Serialize for client component
  const serialized = problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    category: p.category,
    companyTags: p.company_tags ?? [],
    isFreeSolverEnabled: p.is_free_solver_enabled,
  }));

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/practice`,
        name: "Practice DSA Interview Problems",
        description:
          "Browse 70+ DSA coding interview problems — arrays, trees, graphs, DP, and more. Start with free solo practice, then switch into AI Interview Mode when you want the voice simulation.",
        url: `${baseUrl}/practice`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", "@id": baseUrl, name: "TechInView" },
        provider: {
          "@type": "Organization",
          name: "TechInView",
          url: baseUrl,
          logo: `${baseUrl}/og-image.png`,
        },
      },
      {
        "@type": "ItemList",
        name: "DSA Interview Practice Problems",
        description:
          "Coding interview problems for FAANG preparation with AI mock interviews",
        numberOfItems: counts.total,
        itemListElement: problems.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseUrl}/practice/${p.slug}`,
          name: p.title,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Practice Problems",
            item: `${baseUrl}/practice`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does TechInView's AI mock interview work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pick any DSA problem and choose your mode. Practice Mode gives you a simple editor plus test runs, while AI Interview Mode adds a voice interviewer that asks clarifying questions, evaluates your approach, watches you code in a live editor, and scores you on 5 dimensions — problem solving, code quality, communication, technical knowledge, and testing.",
            },
          },
          {
            "@type": "Question",
            name: "What coding interview topics are covered?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `TechInView covers ${counts.total} problems across arrays, strings, trees, graphs, dynamic programming, linked lists, stacks & queues, binary search, heaps, backtracking, sliding window, and tries — with ${counts.easy} easy, ${counts.medium} medium, and ${counts.hard} hard problems.`,
            },
          },
          {
            "@type": "Question",
            name: "Is TechInView free to try?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The curated DSA subset is free to solve in Practice Mode, and every account also gets one 5-minute audio interview preview. No credit card required.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="mb-12 sm:mb-16">
        <p className="text-sm font-semibold text-brand-cyan tracking-wide uppercase mb-3">
          Coding interview prep
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-text mb-4">
          Practice DSA Interview Problems
        </h1>
        <p className="text-brand-muted text-lg leading-relaxed max-w-2xl mb-6">
          {counts.total} problems across arrays, trees, graphs, dynamic
          programming, and more. Start with free solo practice on the curated
          set, then switch any problem into AI Interview Mode when you want the
          voice-based simulation.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-brand-muted mb-6">
          <span>
            <span className="text-brand-green font-semibold">{counts.easy}</span>{" "}
            easy
          </span>
          <span className="text-brand-border">|</span>
          <span>
            <span className="text-brand-amber font-semibold">
              {counts.medium}
            </span>{" "}
            medium
          </span>
          <span className="text-brand-border">|</span>
          <span>
            <span className="text-brand-rose font-semibold">{counts.hard}</span>{" "}
            hard
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/interview/setup?dsaExperience=ai_interview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Practice Free
          </Link>
          <Link
            href="/interview/setup?dsaExperience=ai_interview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-brand-border text-brand-text text-sm font-semibold hover:border-brand-cyan/40 hover:text-brand-cyan transition-colors"
          >
            Try 5-Minute Audio Interview
          </Link>
        </div>
      </section>

      {/* Filterable grid (client component) */}
      <PracticeGrid problems={serialized} />
    </div>
  );
}
