import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, buildOrganizationNode } from "@/lib/blog-seo";
import { cn } from "@/lib/utils";
import {
  BODY,
  ButtonLink,
  CONTAINER,
  H1,
  H3,
  Kicker,
  LABEL,
  LEAD,
  PAD,
  SectionHeader,
} from "@/components/marketing/ds";
import { DifficultyMark } from "@/components/practice/ProblemStatement";
import { getProblems } from "@/lib/db/queries";
import { getBankProblems, pageProblems } from "@/lib/problem-list";
import { PracticeGrid } from "@/components/practice/PracticeGrid";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

export const revalidate = 3600;

const PRACTICE_TITLE = "DSA Interview Practice Problems";
const PRACTICE_DESCRIPTION =
  "Coding interview problems on arrays, strings, trees, graphs, dynamic programming and more. Solve a curated set free in Practice Mode, or take any problem into a voice AI interview.";

export const metadata: Metadata = {
  title: `${PRACTICE_TITLE} | TechInView`,
  description: PRACTICE_DESCRIPTION,
  keywords: [
    "DSA interview problems",
    "coding interview practice",
    "AI mock interview",
    "data structures and algorithms",
    "TechInView",
  ],
  authors: [{ name: "TechInView", url: baseUrl }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/practice" },
  openGraph: {
    title: PRACTICE_TITLE,
    description: PRACTICE_DESCRIPTION,
    type: "website",
    url: `${baseUrl}/practice`,
    siteName: "TechInView",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "TechInView DSA practice problems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PRACTICE_TITLE,
    description: PRACTICE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
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

  // Only the first page ships to the browser; PracticeGrid fetches the rest as it scrolls.
  const initial = pageProblems(await getBankProblems());

  // Shown on the page and mirrored in the FAQPage JSON-LD, so they stay in sync.
  const faqs = [
    {
      q: "How does TechInView's AI mock interview work?",
      a: "Pick a problem and choose a mode. Practice Mode gives you an editor and test runs on your own. AI Interview Mode adds a voice interviewer who answers your clarifying questions, discusses your approach, follows your code in a shared editor, and scores the round on five dimensions: problem solving, code quality, communication, technical knowledge, and testing.",
    },
    {
      q: "What coding interview topics are covered?",
      a: `The library has ${counts.total} problems (${counts.easy} easy, ${counts.medium} medium, ${counts.hard} hard) covering arrays, strings, trees, graphs, dynamic programming, linked lists, stacks and queues, binary search, heaps, backtracking, sliding window, and tries.`,
    },
    {
      q: "Is TechInView free to try?",
      a: "Yes. A curated set of problems is free to solve in Practice Mode, and every account gets one 5-minute voice interview preview. You do not need a credit card to sign up.",
    },
  ];

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/practice`,
        name: PRACTICE_TITLE,
        description: PRACTICE_DESCRIPTION,
        url: `${baseUrl}/practice`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", "@id": baseUrl, name: "TechInView" },
        provider: buildOrganizationNode(baseUrl),
      },
      {
        "@type": "ItemList",
        name: "DSA Interview Practice Problems",
        description:
          "Data structures and algorithms problems for coding interview practice",
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
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className={cn(PAD, "pb-16 pt-20 sm:pb-20 sm:pt-28")}>
        <div className={CONTAINER}>
          <Kicker>Coding interview prep</Kicker>
          <h1 className={cn(H1, "max-w-[14ch]")}>DSA interview practice problems</h1>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-10">
            <p className={cn(LEAD, "max-w-[520px]")}>
              {counts.total} problems across arrays, trees, graphs, dynamic programming and more. Solve the free set on
              your own in Practice Mode. When you want to rehearse the real thing, open any problem in AI Interview Mode
              and talk it through with a voice interviewer.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/signup?next=${encodeURIComponent("/interview/setup?dsaExperience=practice")}`}>
                Practice for free <span className="font-mono" aria-hidden>→</span>
              </ButtonLink>
              <ButtonLink href={`/signup?next=${encodeURIComponent("/interview/setup?dsaExperience=ai_interview")}`} variant="ghost">
                Try a 5-minute voice interview
              </ButtonLink>
            </div>
          </div>
          <div className="mt-16 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/[0.08] pt-5">
            <span className={cn(LABEL, "text-brand-muted")}>{counts.total} problems</span>
            <span className="inline-flex items-center gap-2">
              <DifficultyMark difficulty="easy" />
              <span className={LABEL}>{counts.easy}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <DifficultyMark difficulty="medium" />
              <span className={LABEL}>{counts.medium}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <DifficultyMark difficulty="hard" />
              <span className={LABEL}>{counts.hard}</span>
            </span>
          </div>
        </div>
      </header>

      {/* 01 Library */}
      <section className={cn(PAD, "pb-24 pt-12 sm:pb-32")} aria-labelledby="library">
        <div className={CONTAINER}>
          <SectionHeader
            n="01"
            eyebrow="Problem library"
            title={<span id="library">Pick a problem.</span>}
            description="Free problems open straight into the solver. The rest run as AI interviews."
          />
          <PracticeGrid initial={initial} />
        </div>
      </section>

      {/* 02 FAQ */}
      <section className={cn(PAD, "border-t border-white/[0.08] pb-24 pt-24 sm:pb-32 sm:pt-32")} aria-labelledby="faq">
        <div className={CONTAINER}>
          <SectionHeader n="02" eyebrow="Questions" title={<span id="faq">How practice works.</span>} />
          <dl className="border-t border-white/[0.08]">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="grid gap-3 border-b border-white/[0.08] py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10"
              >
                <dt className={H3}>{faq.q}</dt>
                <dd className={cn(BODY, "max-w-[640px]")}>{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
