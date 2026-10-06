import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  BODY,
  BTN_GHOST,
  BTN_PRIMARY,
  CELL,
  Eyebrow,
  GRID,
  H2,
  H3,
  Kicker,
  LEAD,
  PAD,
  SectionHeader,
} from "@/components/marketing/ds";
import {
  RESUME_PACKS,
  RESUME_PACK_IDS,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";
import { DEFAULT_OG_IMAGE_PATH, serializeJsonLd } from "@/lib/blog-seo";
import { cn } from "@/lib/utils";
import { HeroStack, ReportCarousel } from "@/components/resume-review/ReportViewer";
import {
  CoverPage,
  SAMPLE_PAGE_COUNT,
  SampleReviewPage,
  SampleReviewPage2,
  sampleReportPages,
} from "@/components/resume-review/SampleReport";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

// ponytail: upload + checkout flow is not built yet; every CTA goes through this one href.
const UPLOAD_PATH = "/resume-review/new";

const PAGE_TITLE = "AI Resume Review for Software Engineers";
const PAGE_DESCRIPTION =
  "Upload your resume and get a PDF review in about two minutes: a score, your pages marked up line by line, rewrites ready to paste, and an optional fit check against a job description.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | TechInView`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/resume-review" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: `${baseUrl}/resume-review`,
    siteName: "TechInView",
    images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
  },
};

const PARTS = [
  {
    title: "The verdict",
    body: "One page: a score out of 10, the honest summary, and four numbers. Score, current role, experience and how many critical issues.",
  },
  {
    title: "Your resume, marked up",
    body: "Your own pages with circles, underlines and strike-throughs, and a short note in the margin beside the line it is about.",
  },
  {
    title: "The written review",
    body: "What a screener takes away in thirty seconds, the biggest theme on your resume, and before and after rewrites. Numbers only you know are left as [N].",
  },
  {
    title: "Fit and your questions",
    body: "Add a job description and get checked against what it asks for. Add questions and each one gets a straight answer.",
  },
  {
    title: "Do this first",
    body: "Three to five fixes ranked by impact per hour of your time, so you know where to start tonight.",
  },
];

const MARQUEE = ["Thirty-second read", "Verb", "Scope", "Mechanism", "Result", "Rewrites", "Your questions", "Do this first"];

const STEPS = [
  { title: "Upload your PDF", body: "Up to 3 pages. It has to be a text PDF exported from Docs, Word or LaTeX, not a scan." },
  { title: "Add a job and your questions", body: "Both optional. Paste a job description to be checked against it, and ask anything you want answered, like one page or two." },
  { title: "Download the report", body: "About two minutes later the PDF is ready. It stays in your account until you delete it." },
];

const FAQS = [
  {
    question: "What happens to my resume file?",
    answer:
      "We read it, write the review and throw the file away. We never save the original upload. The report does include your marked-up pages, so it holds your resume's content. You can delete a report at any time and it is removed from storage.",
  },
  {
    question: "How is this different from pasting my resume into ChatGPT?",
    answer:
      "A chat window gives you general advice in a paragraph. This marks up your actual pages line by line, ranks the fixes, writes rewrites that leave placeholders instead of inventing numbers, and checks fit against a real job description. The review is written for software engineering roles and levels.",
  },
  {
    question: "Who is this for?",
    answer:
      "Software engineers from new grad to Staff, and engineering managers. The review judges what technical recruiters and hiring managers look for: scope, impact, evidence and level.",
  },
  {
    question: "Will it make up numbers for me?",
    answer:
      "No. When a bullet needs a metric only you know, the rewrite leaves a [N] or [period] placeholder for you to fill in.",
  },
  {
    question: "Can I upload a Word file?",
    answer: "PDF only. Export from Word, Google Docs or your LaTeX editor with File, then Download as PDF.",
  },
  {
    question: "Why does it reject my PDF?",
    answer:
      "The markup needs the text in the file to find each line on the page. Scanned resumes and image exports have no text, so export a fresh PDF from your editor. Rejected files never use a credit.",
  },
  {
    question: "Do I need to add a job description?",
    answer:
      "No. Without one the review is judged against the level your resume points to, and says which level it assumed. With one, it also checks you against what that job asks for.",
  },
  {
    question: "Can I use a review credit on an interview?",
    answer:
      "No. Review credits and interview credits are separate balances. Both are one-time packs with no recurring billing.",
  },
  {
    question: "What if the review fails?",
    answer: "If the report cannot be generated, the credit goes straight back to your account.",
  },
];

export default function ResumeReviewPage() {
  const country = (headers().get("x-vercel-ip-country") ?? "US").toUpperCase();
  const { region, symbol } = getRegionForCountry(country);
  const priceKey = getDisplayPricingKey(region);
  const locale = priceKey === "inr" ? "en-IN" : "en-US";
  const money = (n: number) => `${symbol}${n.toLocaleString(locale, { maximumFractionDigits: 2 })}`;

  const buyHref = `/signup?${new URLSearchParams({ next: UPLOAD_PATH })}`;
  const single = RESUME_PACKS.resume_single.displayPrices[priceKey];
  const packs = RESUME_PACK_IDS.map((id) => {
    const pack = RESUME_PACKS[id];
    const price = pack.displayPrices[priceKey];
    const full = single * pack.credits;
    return { ...pack, price, full, off: Math.round((1 - price / full) * 100) };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <MarketingShell signupHref={buyHref} ctaLabel="Review my resume">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* ── Hero ── */}
      <header className={cn("relative overflow-hidden pb-24 pt-24", PAD)}>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[18vw] -top-[14vw] h-[80vw] w-[80vw] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.12)_0%,transparent_60%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Kicker className="hero-rise">AI resume review</Kicker>
            <h1
              style={{ "--i": 1 } as React.CSSProperties}
              className="hero-rise max-w-[13ch] text-balance text-[clamp(44px,6.4vw,96px)] font-normal leading-[0.96] tracking-[-0.045em]"
            >
              Your resume, marked up<span className="text-brand-subtle"> line by line.</span>
            </h1>
            <p style={{ "--i": 2 } as React.CSSProperties} className={cn(LEAD, "hero-rise mt-10 max-w-[480px]")}>
              Upload your resume and get a PDF back in about two minutes: a score, your pages marked up the way a
              hiring manager reads them, and rewrites you can paste straight in.
            </p>
            <div style={{ "--i": 3 } as React.CSSProperties} className="hero-rise mt-10 flex flex-wrap gap-3">
              <Link href={buyHref} className={BTN_PRIMARY}>
                Review my resume · {money(single)} <span className="font-mono">→</span>
              </Link>
              <Link href="#sample" className={BTN_GHOST}>
                See a sample report
              </Link>
            </div>
            <div
              style={{ "--i": 4 } as React.CSSProperties}
              className="hero-rise mt-14 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/[0.08] pt-5 font-mono text-xs uppercase tracking-[0.06em] text-brand-muted"
            >
              <span>PDF in about two minutes</span>
              <span>Line-by-line markup</span>
              <span>Optional job fit</span>
            </div>
          </div>
          <div style={{ "--i": 2 } as React.CSSProperties} className="hero-rise px-6 sm:px-10">
            <HeroStack front={<CoverPage />} back={[<SampleReviewPage2 key="r2" />, <SampleReviewPage key="r1" />]} />
          </div>
        </div>
      </header>

      <div className="overflow-hidden border-y border-white/[0.08] py-[22px]" aria-hidden>
        <div className="landing-marquee flex w-max gap-12 whitespace-nowrap font-mono text-[13px] uppercase tracking-[0.14em] text-brand-subtle [animation:landing-marquee_40s_linear_infinite]">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex gap-12">
              <span>{w}</span>
              <span className="text-brand-cyan">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 01 Sample ── */}
      <section id="sample" className={cn("scroll-mt-20 py-[120px]", PAD)}>
        <LandingReveal className="mx-auto max-w-[1320px]">
          <SectionHeader
            n="01"
            eyebrow="Sample report"
            title="The full report, page by page."
            description={`Swipe through all ${SAMPLE_PAGE_COUNT} pages for a sample resume, reviewed against a sample job. The candidate is fictional.`}
          />
          <ReportCarousel pages={sampleReportPages()} fileName="alex-rivera-resume-review.pdf" />
        </LandingReveal>
      </section>

      {/* ── 02 What's inside ── */}
      <section className={cn("py-[120px]", PAD)}>
        <LandingReveal className="mx-auto max-w-[1320px]">
          <SectionHeader n="02" eyebrow="What's in the report" title="Five parts, five or six pages." />
          <div className={cn(GRID, "reveal-stagger grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]")}>
            {PARTS.map((p, i) => (
              <div key={p.title} className={cn(CELL, "p-8")}>
                <div className="mb-10 font-mono text-xs text-brand-cyan">/0{i + 1}</div>
                <h3 className={cn(H3, "mb-3")}>{p.title}</h3>
                <p className={BODY}>{p.body}</p>
              </div>
            ))}
          </div>
        </LandingReveal>
      </section>

      {/* ── 03 How it works ── */}
      <section id="how-it-works" className={cn("scroll-mt-20 py-[120px]", PAD)}>
        <LandingReveal className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-16">
          <div>
            <Eyebrow n="03">How it works</Eyebrow>
            <h2 className={cn(H2, "max-w-[12ch]")}>Upload, wait a few minutes, download.</h2>
          </div>
          <ol className="reveal-stagger relative border-t border-white/[0.08]">
            <span aria-hidden className="absolute bottom-8 left-[5px] top-9 w-px bg-white/[0.08]">
              <span className="rr-travel absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-brand-cyan shadow-[0_0_12px_rgb(var(--brand-cyan))]" />
            </span>
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[48px_1fr] border-b border-white/[0.08] py-8 pl-5">
                <span className="font-mono text-xs text-brand-cyan">0{i + 1}</span>
                <div>
                  <h3 className={cn(H3, "mb-2")}>{s.title}</h3>
                  <p className={BODY}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </LandingReveal>
      </section>

      {/* ── 04 Pricing ── */}
      <section id="pricing" className={cn("scroll-mt-20 py-[120px]", PAD)}>
        <LandingReveal className="mx-auto max-w-[1320px]">
          <SectionHeader
            n="04"
            eyebrow="Pricing"
            title="Pay per review."
            description="Buy one review, or three so you can review, fix and review again. Credits never expire."
          />
          <div className="reveal-stagger mx-auto grid max-w-[860px] grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
            {packs.map((p) => {
              const featured = p.credits > 1;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col gap-7 rounded-[18px] border p-7",
                    featured
                      ? "border-brand-cyan bg-brand-cyan/[0.04] shadow-[0_0_60px_rgb(var(--brand-cyan)/0.08)]"
                      : "border-white/[0.09]"
                  )}
                >
                  <div
                    className={cn(
                      "flex justify-between font-mono text-[11px] uppercase tracking-[0.12em]",
                      featured ? "text-brand-cyan" : "text-brand-muted"
                    )}
                  >
                    <span>{p.label}</span>
                    {p.badge && p.off > 0 && <span>{`${p.badge} · −${p.off}%`}</span>}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-[56px] font-light leading-none tracking-[-0.05em]">{money(p.price)}</span>
                    {p.off > 0 && <span className="text-base text-brand-subtle line-through">{money(p.full)}</span>}
                  </div>
                  <ul className="flex flex-1 flex-col gap-2.5 text-sm text-brand-muted">
                    {p.credits > 1 && (
                      <li className="text-brand-text">
                        {money(Math.round((p.price / p.credits) * 100) / 100)} per review
                      </li>
                    )}
                    <li>{p.credits > 1 ? `${p.credits} full PDF reports` : "One full PDF report"}</li>
                    <li>Line-by-line markup and rewrites</li>
                    <li>{p.credits > 1 ? "Review again after each fix" : "Optional job fit page"}</li>
                  </ul>
                  <Link
                    href={buyHref}
                    className={cn(
                      "rounded-full p-[13px] text-center text-sm transition-colors",
                      featured
                        ? "bg-brand-cyan font-medium text-brand-deep hover:bg-brand-text"
                        : "border border-white/[0.18] hover:border-brand-cyan hover:text-brand-cyan"
                    )}
                  >
                    Buy {p.label.toLowerCase()}
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">
            One-time packs · No recurring billing · Failed reviews are refunded
          </div>
        </LandingReveal>
      </section>

      {/* ── 05 FAQ ── */}
      <section id="faq" className={cn("scroll-mt-20 py-[120px]", PAD)}>
        <LandingReveal className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-16">
          <div>
            <Eyebrow n="05">FAQ</Eyebrow>
            <h2 className={cn(H2, "max-w-[12ch]")}>Before you upload.</h2>
          </div>
          <div className="reveal-stagger border-t border-white/[0.08]">
            {FAQS.map((f, i) => (
              <details key={f.question} name="resume-faq" open={i === 0} className="group border-b border-white/[0.08]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-[19px] tracking-[-0.01em] transition-colors hover:text-brand-cyan [&::-webkit-details-marker]:hidden">
                  <span>{f.question}</span>
                  <span className="flex-none font-mono text-lg text-brand-cyan">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="pb-7 pr-12 text-pretty text-base leading-relaxed text-brand-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </LandingReveal>
      </section>

      {/* ── Closing: hand off to interviews ── */}
      <section className={cn("relative overflow-hidden border-t border-white/[0.08] pb-[120px] pt-[140px]", PAD)}>
        <LandingReveal className="relative mx-auto max-w-[1320px]">
          <Kicker>Next step</Kicker>
          <h2 className="max-w-[16ch] text-balance text-[clamp(40px,6.4vw,96px)] font-normal leading-[0.98] tracking-[-0.045em]">
            The resume gets you the call. <span className="text-brand-subtle">Practice the interview.</span>
          </h2>
          <div className="mt-14 flex flex-wrap gap-3">
            <Link href={buyHref} className={BTN_PRIMARY}>
              Review my resume <span className="font-mono">→</span>
            </Link>
            <Link href="/" className={BTN_GHOST}>
              AI mock interviews
            </Link>
          </div>
        </LandingReveal>
      </section>
    </MarketingShell>
  );
}
