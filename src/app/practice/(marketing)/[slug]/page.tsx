import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, buildOrganizationNode } from "@/lib/blog-seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { getProblems, getProblemBySlug } from "@/lib/db/queries";
import {
  CELL,
  CHIP,
  CONTAINER,
  GRID,
  H1,
  LABEL,
  LINK_ARROW,
  PAD,
  PROSE,
} from "@/components/marketing/ds";
import { PracticeModeCta } from "@/components/practice/PracticeModeCta";
import { LandingReveal } from "@/components/landing/LandingReveal";
import {
  DifficultyMark,
  ProblemConstraints,
  ProblemExamples,
  SectionLabel,
} from "@/components/practice/ProblemStatement";
import {
  diagramsForExamples,
  stripEmbeddedExamples,
} from "@/lib/problems/statement";
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
}) {
  const catLabel = capitalizeCategory(problem.category);
  const companies = (problem.company_tags ?? []).slice(0, 3).join(", ");

  // First sentence-ish of the statement, cut on a word boundary.
  const plain = problem.description
    .replace(/[#*`>\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const snippet =
    plain.length > 110
      ? `${plain.slice(0, 110).replace(/\s+\S*$/, "")}...`
      : plain;

  return `${problem.title} is a ${problem.difficulty} ${catLabel.toLowerCase()} problem. ${snippet}${companies ? ` Company tags: ${companies}.` : ""} Read the examples and constraints, then practice it out loud with a voice AI interviewer.`;
}

export async function generateMetadata({
  params,
}: PracticeSlugPageProps): Promise<Metadata> {
  const problem = await getProblemBySlug(params.slug);
  if (!problem) {
    return { title: "Problem not found | TechInView", robots: { index: false } };
  }

  const catLabel = capitalizeCategory(problem.category);
  const heading = `${problem.title}: ${catLabel} interview problem`;
  const description = buildMetaDescription(problem);
  const url = `${baseUrl}/practice/${problem.slug}`;

  return {
    title: `${heading} | TechInView`,
    description,
    keywords: [
      problem.title,
      `${problem.title} interview question`,
      `${catLabel} interview problems`,
      ...(problem.company_tags ?? []).map((t) => `${t} coding interview`),
      "coding interview practice",
      "AI mock interview",
    ],
    authors: [{ name: "TechInView", url: baseUrl }],
    robots: { index: true, follow: true },
    alternates: { canonical: `/practice/${problem.slug}` },
    openGraph: {
      title: heading,
      description,
      type: "article",
      url,
      siteName: "TechInView",
      locale: "en_US",
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${problem.title} practice problem on TechInView`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Example = {
  input: string;
  output: string;
  explanation?: string;
  diagram?: string;
};
type OptimalComplexity = { time?: string; space?: string };

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

  // Every description repeats its examples in prose while the structured
  // array carries them too, so the prose copies come out and the ASCII
  // diagrams they hide move onto the example they belong to.
  const statement = stripEmbeddedExamples(problem.description);
  const structuredExamples = (problem.examples ?? []) as Example[];
  const diagrams = diagramsForExamples(problem.description, structuredExamples);
  const examples: Example[] = structuredExamples.map((example, i) => ({
    ...example,
    diagram: diagrams[i],
  }));
  const complexity = (problem.optimal_complexity ?? {}) as OptimalComplexity;
  const companyTags = problem.company_tags ?? [];
  const constraints = problem.constraints ?? [];

  // Compile markdown description
  const { content: descriptionContent } = await compileMDX({
    source: statement,
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
      headline: `${problem.title}: ${catLabel} interview problem`,
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
      provider: buildOrganizationNode(baseUrl),
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

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  const showLockedNotice = searchParams?.locked === "solver";
  const initialExperience = normalizeDsaExperience(
    typeof searchParams?.dsaExperience === "string"
      ? searchParams.dsaExperience
      : undefined
  );

  // Number the sections that actually render so the eyebrows stay sequential.
  const hasComplexity = Boolean(complexity.time || complexity.space);
  let section = 1;
  const nextN = () => String(++section).padStart(2, "0");
  const examplesN = examples.length > 0 ? nextN() : undefined;
  const constraintsN = constraints.length > 0 ? nextN() : undefined;
  const complexityN = hasComplexity ? nextN() : undefined;
  const ctaN = nextN();

  return (
    <article className={cn(PAD, "pb-24 pt-14 sm:pb-32 sm:pt-20")}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={cn(CONTAINER, "max-w-[880px]")}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hero-rise mb-12">
          <ol className={cn(LABEL, "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1")}>
            <li>
              <Link href="/practice" className="transition-colors hover:text-brand-cyan">
                Practice
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="min-w-0 truncate text-brand-muted" aria-current="page">
              {problem.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-14 border-b border-white/[0.08] pb-10">
          <div style={{ "--i": 1 } as React.CSSProperties} className="hero-rise mb-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <DifficultyMark difficulty={problem.difficulty} />
            <span className={LABEL}>{catLabel}</span>
            <span className={LABEL}>
              {problem.is_free_solver_enabled ? "Free practice" : "AI interview only"}
            </span>
          </div>
          <h1 style={{ "--i": 2 } as React.CSSProperties} className={cn(H1, "hero-rise text-[clamp(36px,5.2vw,72px)] leading-[1.02]")}>
            {problem.title}
          </h1>

          {companyTags.length > 0 && (
            <div style={{ "--i": 3 } as React.CSSProperties} className="hero-rise mt-8 flex flex-wrap items-center gap-2">
              <span className={cn(LABEL, "mr-2")}>Asked at</span>
              {companyTags.map((tag) => (
                <span key={tag} className={CHIP}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Problem statement */}
        <section style={{ "--i": 4 } as React.CSSProperties} className="hero-rise mb-16">
          <SectionLabel n="01">Problem</SectionLabel>
          <div
            className={cn(
              PROSE,
              "prose-li:marker:text-brand-subtle prose-code:text-[0.88em] prose-pre:overflow-x-auto prose-pre:px-5 prose-pre:py-4 prose-pre:text-[13px] prose-pre:leading-[1.7] prose-pre:text-brand-muted",
              "[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[1em] [&_pre_code]:text-inherit"
            )}
          >
            {descriptionContent}
          </div>
        </section>

        <LandingReveal>
          <ProblemExamples examples={examples} n={examplesN} />
        </LandingReveal>

        <LandingReveal>
          <ProblemConstraints constraints={constraints} n={constraintsN} />
        </LandingReveal>

        {/* Complexity */}
        {hasComplexity && (
          <LandingReveal>
          <section className="mb-16">
            <SectionLabel n={complexityN}>Optimal complexity</SectionLabel>
            <dl className={cn(GRID, "sm:grid-cols-2")}>
              {complexity.time && (
                <div className={cn(CELL, "px-5 py-5 transition-colors hover:bg-white/[0.02]")}>
                  <dt className={LABEL}>Time</dt>
                  <dd className="mt-2 font-mono text-lg text-brand-text">{complexity.time}</dd>
                </div>
              )}
              {complexity.space && (
                <div className={cn(CELL, "px-5 py-5 transition-colors hover:bg-white/[0.02]")}>
                  <dt className={LABEL}>Space</dt>
                  <dd className="mt-2 font-mono text-lg text-brand-text">{complexity.space}</dd>
                </div>
              )}
            </dl>
          </section>
          </LandingReveal>
        )}

        {showLockedNotice ? (
          <p className="mb-6 border-l border-brand-amber pl-4 text-[15px] leading-relaxed text-brand-muted">
            <span className="sr-only">Locked. </span>
            This problem is not in the free Practice Mode set yet. You can still take it as an AI interview below.
          </p>
        ) : null}

        <LandingReveal>
          <PracticeModeCta
            problemSlug={problem.slug}
            isFreeSolverEnabled={problem.is_free_solver_enabled}
            initialExperience={initialExperience}
            n={ctaN}
          />
        </LandingReveal>

        {/* Related problems */}
        {related.length > 0 && (
          <LandingReveal>
          <nav className="mt-20" aria-labelledby="related-problems">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
              <h2 id="related-problems" className="font-mono text-xs font-normal uppercase tracking-[0.14em] text-brand-subtle">
                More {catLabel} problems
              </h2>
              <Link href="/practice" className={LINK_ARROW}>
                All problems <span aria-hidden>→</span>
              </Link>
            </div>
            <ul className={cn(GRID, "reveal-stagger sm:grid-cols-2")}>
              {related.map((p) => (
                <li key={p.slug} className={CELL}>
                  <Link
                    href={`/practice/${p.slug}`}
                    className="group flex h-full items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-brand-text transition-colors group-hover:text-brand-cyan">
                        {p.title}
                      </span>
                      <DifficultyMark difficulty={p.difficulty} className="mt-2" />
                    </span>
                    <span aria-hidden className="font-mono text-brand-subtle transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-brand-cyan">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          </LandingReveal>
        )}
      </div>
    </article>
  );
}
