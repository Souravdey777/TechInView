import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Building2,
  Clock,
  BarChart3,
  Tag,
  ChevronRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProblems, getProblemBySlug } from "@/lib/db/queries";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { DifficultyLevel } from "@/lib/constants";
import { PracticeModeCta } from "@/components/practice/PracticeModeCta";
import { normalizeDsaExperience } from "@/lib/dsa";

type PracticeSlugPageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const problems = await getProblems();
  return problems.map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600; // ISR — rebuild every hour

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

function buildMetaDescription(problem: {
  title: string;
  difficulty: string;
  category: string;
  description: string;
  company_tags: string[] | null;
  optimal_complexity: unknown;
}) {
  const companies = (problem.company_tags ?? []).slice(0, 4).join(", ");
  const complexity = problem.optimal_complexity as OptimalComplexity | null;
  const complexityStr = complexity?.time
    ? ` Optimal: ${complexity.time} time.`
    : "";
  const catLabel = capitalizeCategory(problem.category);

  // Use first ~100 chars of the problem description as a natural snippet
  const snippet = problem.description
    .replace(/[#*`\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return `${problem.title} (${problem.difficulty}) — ${catLabel}. ${snippet}...${complexityStr}${companies ? ` Asked at ${companies}.` : ""} Practice with a voice AI interviewer on TechInView.`;
}

export async function generateMetadata({
  params,
}: PracticeSlugPageProps): Promise<Metadata> {
  const problem = await getProblemBySlug(params.slug);
  if (!problem) return { title: "Problem not found" };

  const titleFormatted = problem.title.replace(/-/g, " ");
  const catLabel = capitalizeCategory(problem.category);
  const title = `${problem.title} — ${catLabel} Interview Problem | TechInView`;
  const description = buildMetaDescription(problem);

  return {
    title,
    description,
    keywords: [
      problem.title,
      `${titleFormatted} solution`,
      `${titleFormatted} interview question`,
      `${titleFormatted} ${problem.difficulty}`,
      `${catLabel} interview problems`,
      problem.category,
      ...(problem.company_tags ?? []).map((t) => `${t} interview questions`),
      "coding interview practice",
      "AI mock interview",
      "DSA practice",
      "leetcode alternative",
      "FAANG interview prep",
      "TechInView",
    ],
    authors: [{ name: "TechInView", url: baseUrl }],
    robots: { index: true, follow: true },
    openGraph: {
      title: `${problem.title} — Practice with AI Interviewer`,
      description,
      type: "article",
      url: `${baseUrl}/practice/${problem.slug}`,
      siteName: "TechInView",
      locale: "en_US",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Practice ${problem.title} — TechInView`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${problem.title} — ${catLabel} Problem | TechInView`,
      description,
      images: ["/og-image.png"],
    },
    alternates: { canonical: `/practice/${problem.slug}` },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Example = { input: string; output: string; explanation?: string };
type OptimalComplexity = { time?: string; space?: string };

function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold",
        cfg.bgColor,
        cfg.color
      )}
    >
      {cfg.label}
    </span>
  );
}

function capitalizeCategory(cat: string) {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PracticeSlugPage({
  params,
  searchParams,
}: PracticeSlugPageProps) {
  const problem = await getProblemBySlug(params.slug);
  if (!problem) notFound();

  const examples = (problem.examples ?? []) as Example[];
  const complexity = (problem.optimal_complexity ?? {}) as OptimalComplexity;
  const companyTags = problem.company_tags ?? [];
  const constraints = problem.constraints ?? [];

  // Compile markdown description
  const { content: descriptionContent } = await compileMDX({
    source: problem.description,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  // Related problems: same category, different slug
  const allProblems = await getProblems({ category: problem.category });
  const related = allProblems
    .filter((p) => p.slug !== problem.slug)
    .slice(0, 4);

  // JSON-LD structured data
  const catLabel = capitalizeCategory(problem.category);
  const pageUrl = `${baseUrl}/practice/${problem.slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "LearningResource",
      "@id": pageUrl,
      name: problem.title,
      headline: `${problem.title} — ${catLabel} Interview Problem`,
      description: buildMetaDescription(problem),
      url: pageUrl,
      educationalLevel: problem.difficulty,
      learningResourceType: "Practice Problem",
      inLanguage: "en",
      isAccessibleForFree: true,
      teaches: `${catLabel} data structures and algorithms`,
      about: [
        { "@type": "Thing", name: catLabel },
        { "@type": "Thing", name: "Coding Interview Preparation" },
      ],
      ...(companyTags.length > 0 && {
        keywords: companyTags.join(", "),
      }),
      provider: {
        "@type": "Organization",
        name: "TechInView",
        url: baseUrl,
        logo: `${baseUrl}/og-image.png`,
      },
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
        {
          "@type": "ListItem",
          position: 3,
          name: problem.title,
          item: pageUrl,
        },
      ],
    },
  ];

  // FAQPage schema from examples — helps Google show rich results
  if (examples.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: examples.map((ex, i) => ({
        "@type": "Question",
        name: `Example ${i + 1}: What is the output for input ${ex.input}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Output: ${ex.output}${ex.explanation ? `. ${ex.explanation}` : ""}`,
        },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  const showLockedNotice = searchParams?.locked === "solver";
  const initialExperience = normalizeDsaExperience(
    typeof searchParams?.dsaExperience === "string"
      ? searchParams.dsaExperience
      : undefined
  );

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb nav */}
      <Link
        href="/practice"
        className="text-sm text-brand-muted hover:text-brand-cyan transition-colors mb-8 inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All problems
      </Link>

      {/* Header */}
      <header className="mb-10 pb-8 border-b border-brand-border">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <DifficultyBadge
            difficulty={problem.difficulty as DifficultyLevel}
          />
          <span className="text-xs text-brand-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {capitalizeCategory(problem.category)}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-text leading-tight mb-4">
          {problem.title}
        </h1>

        {/* Company tags */}
        {companyTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Building2 className="w-4 h-4 text-brand-muted shrink-0" />
            {companyTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md bg-brand-surface border border-brand-border text-brand-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Problem description */}
      <section className="mb-10">
        <div
          className="
            prose prose-invert prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-brand-text
            prose-p:text-brand-muted prose-p:leading-relaxed
            prose-strong:text-brand-text prose-strong:font-semibold
            prose-a:text-brand-cyan prose-a:no-underline hover:prose-a:underline
            prose-li:text-brand-muted prose-li:marker:text-brand-cyan
            prose-code:text-brand-cyan prose-code:bg-brand-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-brand-surface prose-pre:border prose-pre:border-brand-border prose-pre:rounded-xl
          "
        >
          {descriptionContent}
        </div>
      </section>

      {/* Examples */}
      {examples.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold font-heading text-brand-text mb-4">
            Examples
          </h2>
          <div className="space-y-4">
            {examples.map((ex, i) => (
              <div
                key={i}
                className="glass-card p-5 space-y-2"
              >
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Example {i + 1}
                </p>
                <div className="text-sm font-mono">
                  <p className="text-brand-muted">
                    <span className="text-brand-text font-semibold">Input:</span>{" "}
                    {ex.input}
                  </p>
                  <p className="text-brand-muted mt-1">
                    <span className="text-brand-text font-semibold">Output:</span>{" "}
                    {ex.output}
                  </p>
                  {ex.explanation && (
                    <p className="text-brand-muted mt-1">
                      <span className="text-brand-text font-semibold">
                        Explanation:
                      </span>{" "}
                      {ex.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Constraints */}
      {constraints.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold font-heading text-brand-text mb-4">
            Constraints
          </h2>
          <ul className="space-y-1.5">
            {constraints.map((c, i) => (
              <li
                key={i}
                className="text-sm text-brand-muted font-mono flex items-start gap-2"
              >
                <span className="text-brand-cyan mt-0.5 shrink-0">-</span>
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Complexity */}
      {(complexity.time || complexity.space) && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold font-heading text-brand-text mb-4">
            Optimal Complexity
          </h2>
          <div className="flex flex-wrap gap-4">
            {complexity.time && (
              <div className="glass-card px-5 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
                <div>
                  <p className="text-xs text-brand-muted">Time</p>
                  <p className="text-sm font-mono text-brand-text font-semibold">
                    {complexity.time}
                  </p>
                </div>
              </div>
            )}
            {complexity.space && (
              <div className="glass-card px-5 py-3 flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-brand-green shrink-0" />
                <div>
                  <p className="text-xs text-brand-muted">Space</p>
                  <p className="text-sm font-mono text-brand-text font-semibold">
                    {complexity.space}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showLockedNotice ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-amber/20 bg-brand-amber/10 px-4 py-3 text-sm text-brand-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
          <p>
            This problem is not in the free Practice Mode subset yet. You can still open it in AI Interview Mode from below.
          </p>
        </div>
      ) : null}

      <PracticeModeCta
        problemSlug={problem.slug}
        isFreeSolverEnabled={problem.is_free_solver_enabled}
        initialExperience={initialExperience}
      />

      {/* Related problems */}
      {related.length > 0 && (
        <nav className="mt-14" aria-label="Related problems">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            More {capitalizeCategory(problem.category)} problems
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/practice/${p.slug}`}
                  className="group glass-card p-4 flex items-center justify-between gap-3 transition-all hover:border-brand-cyan/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text group-hover:text-brand-cyan transition-colors truncate">
                      {p.title}
                    </p>
                    <DifficultyBadge
                      difficulty={p.difficulty as DifficultyLevel}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted shrink-0 group-hover:text-brand-cyan transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
