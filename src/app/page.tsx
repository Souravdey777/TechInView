import Link from "next/link";
import { headers } from "next/headers";
import { HeroCanvas, InterviewRoomDemo, LiveStatus, PhaseTimeline, ScoreCard } from "@/components/landing/LandingLive";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { BTN_GHOST, BTN_PRIMARY, Eyebrow, H2, LINK_ARROW, PAD } from "@/components/marketing/ds";
import {
  CREDIT_PACKS,
  EARLY_ACCESS_DISCOUNT_PERCENT,
  EARLY_ACCESS_PURCHASE_LIMIT,
  earlyAccessPrice,
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
  PACK_IDS,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";
import { INTERVIEWER } from "@/lib/interviewer";
import { getCachedEarlyAccessSpotsLeft } from "@/lib/db/queries";
import { cn } from "@/lib/utils";


type LandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const GAPS = [
  {
    title: "You have to think out loud",
    body: "Interviewers grade how you explain the plan as well as the code. Practicing in silence skips half the test.",
  },
  {
    title: "Weak approaches get challenged",
    body: "Propose a nested loop and the interviewer asks if you can do better. Skip an edge case and it asks what happens on empty input.",
  },
  {
    title: "The clock is real",
    body: "A timer, a running editor and a voice waiting on your answer. That combination is what makes people freeze, so rehearse it.",
  },
  {
    title: "Feedback you can act on",
    body: "Every round ends with a scorecard: a score per dimension, written notes on what cost you points, and the transcript to check them against.",
  },
];

const SAMPLE_DIMS = [
  { name: "Problem solving", short: "PROBLEM SOLVING", score: 84 },
  { name: "Code quality", short: "CODE QUALITY", score: 76 },
  { name: "Communication", short: "COMMUNICATION", score: 90 },
  { name: "Technical knowledge", short: "TECH KNOWLEDGE", score: 71 },
  { name: "Testing", short: "TESTING", score: 62 },
];

const FAQS = [
  {
    question: "How does the AI mock interview work?",
    answer:
      "You talk to an AI interviewer by voice while you code in a shared editor. A 45-minute coding round follows the shape of a real technical screen: intro, problem, clarifying questions, approach, coding, testing, complexity analysis, a follow-up and wrap-up. The interviewer sees your code as you write it and pushes back on a weak approach instead of approving whatever you say.",
  },
  {
    question: "Which interview rounds can I practice?",
    answer:
      "DSA coding interviews, Technical Q&A, Engineering Manager and Behavioral rounds. Behavioral and Engineering Manager rounds are graded against a value lens you pick, such as Amazon Leadership Principles or Googleyness. System Design and Machine Coding are not available yet.",
  },
  {
    question: "Which programming languages can I use?",
    answer:
      "Python and JavaScript run end to end, with test results shown in the editor. Java and C++ appear in the language picker, but running code in them is not supported yet. Use Python or JavaScript if you want to execute tests during the round.",
  },
  {
    question: "How long is a session?",
    answer:
      "A full AI interview is 45 minutes. Practice Mode has no timer. Each new account gets one free 5-minute AI interview on an easy DSA problem, so you can try the voice format before buying a pack.",
  },
  {
    question: "Do I need a subscription?",
    answer:
      "No. DSA Practice Mode is free and needs no card. AI interviews are sold as one-time packs of 1, 3 or 6 interviews, priced in your local currency, with no recurring billing.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "You can sign up and browse on a phone, but the interview room needs a laptop or desktop with a microphone. It shows the interviewer, the problem, your code and the tests side by side.",
  },
  {
    question: "What do I get after the round?",
    answer:
      "An overall score out of 100, a hire recommendation from Strong Hire to No Hire, written feedback per dimension and the full transcript. Coding rounds are scored on problem solving, code quality, communication, technical knowledge and testing. Behavioral and Engineering Manager rounds add a competency report with evidence, gaps and STAR coverage for each competency.",
  },
];

const MARQUEE = ["Intro", "Problem", "Clarify", "Approach", "Code", "Test", "Complexity", "Follow-up", "Wrap-up"];

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const country = (headers().get("x-vercel-ip-country") ?? "US").toUpperCase();
  const { region, symbol } = getRegionForCountry(country);
  const priceKey = getDisplayPricingKey(region);
  const locale = priceKey === "inr" ? "en-IN" : "en-US";
  const money = (n: number) => `${symbol}${n.toLocaleString(locale, { maximumFractionDigits: 2 })}`;

  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : undefined;
  const buildAuthHref = (pathname: "/login" | "/signup", next?: string) => {
    const authParams = new URLSearchParams();
    if (ref) authParams.set("ref", ref);
    if (next) authParams.set("next", next);
    const query = authParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const loginHref = buildAuthHref("/login");
  const practiceSignupHref = buildAuthHref("/signup", "/interview/setup?dsaExperience=ai_interview");
  const previewSignupHref = practiceSignupHref;
  const buyHref = buildAuthHref("/signup");

  const spotsLeft = await getCachedEarlyAccessSpotsLeft();
  const packs = PACK_IDS.map((id) => {
    const pack = CREDIT_PACKS[id];
    // Slashed price is the pack's own list price; the early-access price sits next to it.
    const full = pack.displayPrices[priceKey];
    const price = spotsLeft > 0 ? earlyAccessPrice(full) : full;
    return {
      id,
      label: pack.label,
      credits: pack.credits,
      price,
      full,
      off: Math.round((1 - price / full) * 100),
      badge: pack.badge,
    };
  });

  return (
    <MarketingShell loginHref={loginHref} signupHref={practiceSignupHref}>
        {/* ── Hero ── */}
        <header className={cn("relative flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden pb-14 pt-24", PAD)}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[18vw] -top-[14vw] h-[80vw] w-[80vw] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.16)_0%,rgb(var(--brand-cyan)/0.05)_35%,transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[30vw] -left-[20vw] h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.09)_0%,transparent_60%)]"
          />
          <HeroCanvas />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand-deep to-transparent" />

          <div className="relative mx-auto w-full max-w-[1320px]">
            <div className="hero-rise mb-7 font-mono text-xs uppercase tracking-[0.14em] text-brand-cyan">[ Voice-first AI mock interviews ]</div>
            <h1 style={{ "--i": 1 } as React.CSSProperties} className="hero-rise max-w-[12ch] text-balance text-[clamp(44px,7.4vw,112px)] font-normal leading-[0.96] tracking-[-0.045em]">
              Practice the interview<span className="text-brand-subtle">, not just the problem.</span>
            </h1>
            <div style={{ "--i": 2 } as React.CSSProperties} className="hero-rise mt-12 flex flex-wrap items-end justify-between gap-10">
              <p className="max-w-[460px] text-pretty text-[17px] leading-relaxed text-brand-muted">
                Solve DSA problems free. When you are ready, run a {FULL_INTERVIEW_DURATION_MINUTES}-minute round with an
                AI interviewer that talks to you, reads your code as you type, and pushes back when your approach is weak.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={practiceSignupHref} className={BTN_PRIMARY}>
                  Practice free <span aria-hidden className="font-mono">→</span>
                </Link>
                <Link href={previewSignupHref} className={BTN_GHOST}>
                  Try a free {FREE_TRIAL_DURATION_MINUTES}-minute interview
                </Link>
              </div>
            </div>
            <div style={{ "--i": 3 } as React.CSSProperties} className="hero-rise mt-16 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/[0.08] pt-5 font-mono text-xs uppercase tracking-[0.06em] text-brand-muted">
              <LiveStatus name={INTERVIEWER.name} />
              <span>Voice-first rounds</span>
              <span>Python + JS run live</span>
              <span>Scorecard after every round</span>
            </div>
          </div>
        </header>

        {/* ── 01 Interview room ── */}
        <section id="room" className={cn("relative pb-[120px] pt-[140px]", PAD)}>
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[55%] h-[60vw] max-h-[900px] w-[90vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--brand-cyan)/0.08)_0%,rgb(var(--brand-cyan)/0.04)_35%,transparent_65%)]"
          />
          <LandingReveal className="relative mx-auto max-w-[1320px]">
            <div className="mb-12">
              <Eyebrow n="01">Interview room</Eyebrow>
              <h2 className={cn(H2, "max-w-[16ch]")}>The interviewer on one side. Your code on the other.</h2>
            </div>
            <InterviewRoomDemo name={INTERVIEWER.name} />
          </LandingReveal>
        </section>

        {/* ── 02 What changes ── */}
        <section id="features" className={cn("scroll-mt-20 py-[120px]", PAD)}>
          <LandingReveal className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-16">
            <div>
              <Eyebrow n="02">Why practice out loud</Eyebrow>
              <h2 className={H2}>
                LeetCode trains answers. <span className="text-brand-cyan">Interviews test signal.</span>
              </h2>
              <p className="mt-7 max-w-[440px] text-pretty text-[17px] leading-relaxed text-brand-muted">
                Plenty of people who fail a coding round could have solved the problem at home. They went quiet, skipped
                the clarifying questions, coded into a dead end, or never tested. Those habits only show up when someone
                is listening.
              </p>
            </div>
            <div className="reveal-stagger grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] border-t border-white/[0.08]">
              {GAPS.map((g, i) => (
                <div key={g.title} className="group border-b border-white/[0.08] pb-10 pr-7 pt-8">
                  <div className="mb-10 font-mono text-xs text-brand-cyan transition-transform duration-300 group-hover:translate-x-1.5">/0{i + 1}</div>
                  <h3 className="mb-3 text-xl font-medium tracking-[-0.02em]">{g.title}</h3>
                  <p className="text-[15px] leading-relaxed text-brand-muted">{g.body}</p>
                </div>
              ))}
            </div>
          </LandingReveal>
        </section>

        {/* ── 03 How it works ── */}
        <section id="how-it-works" className={cn("scroll-mt-20 py-[120px]", PAD)}>
          <LandingReveal className="mx-auto max-w-[1320px]">
            <div className="mb-16">
              <Eyebrow n="03">How a round runs</Eyebrow>
              <h2 className={cn(H2, "max-w-[18ch]")}>{FULL_INTERVIEW_DURATION_MINUTES} minutes, nine phases, from intro to wrap-up.</h2>
            </div>
            <PhaseTimeline />
          </LandingReveal>
        </section>

        {/* ── 04 Scorecard ── */}
        <section id="score" className={cn("relative py-[120px]", PAD)}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[10vw] top-1/2 h-[60vw] w-[60vw] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.12)_0%,transparent_60%)]"
          />
          <LandingReveal className="relative mx-auto max-w-[1320px]">
            <ScoreCard
              dims={SAMPLE_DIMS}
              overall={77}
              interviewerName={INTERVIEWER.name}
              header={
                <>
                  <Eyebrow n="04">After the round</Eyebrow>
                  <h2 className={H2}>Scored on five dimensions, with notes on each.</h2>
                  <p className="mb-10 mt-7 max-w-[440px] text-[17px] leading-relaxed text-brand-muted">
                    An overall score out of 100, a hire recommendation, written feedback per dimension and the full
                    transcript. Behavioral and Engineering Manager rounds add a competency report graded against the
                    value lens you picked.
                  </p>
                </>
              }
              footer={
                <Link
                  href="/how-ai-evaluates"
                  className={cn(LINK_ARROW, "mt-7")}
                >
                  How we score a round <span aria-hidden>→</span>
                </Link>
              }
            />
          </LandingReveal>
        </section>

        {/* ── 05 Pricing ── */}
        <section id="pricing" className={cn("relative scroll-mt-20 py-[120px]", PAD)}>
          <div
            aria-hidden
            className="pointer-events-none absolute left-[62%] top-[60%] h-[50vw] w-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.11)_0%,transparent_60%)]"
          />
          <LandingReveal className="relative mx-auto max-w-[1320px]">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow n="05">Pricing</Eyebrow>
                <h2 className={H2}>Interview packs, not a subscription.</h2>
              </div>
              <p className="max-w-[360px] text-[15px] leading-relaxed text-brand-muted">
                DSA practice is free. Pay once for full {FULL_INTERVIEW_DURATION_MINUTES}-minute AI interviews and use
                each credit on a coding, Technical Q&amp;A, Engineering Manager or Behavioral round.
                {spotsLeft > 0 && (
                  <span className="mt-3 block text-brand-cyan">
                    Early access: {EARLY_ACCESS_DISCOUNT_PERCENT}% off the first {EARLY_ACCESS_PURCHASE_LIMIT} purchases.{" "}
                    {spotsLeft} left.
                  </span>
                )}
              </p>
            </div>
            <div className="reveal-stagger grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3">
              <PriceCard
                label="Free practice"
                price={money(0)}
                features={["Curated DSA problem set", "Run Python or JS, progress saved", `One free ${FREE_TRIAL_DURATION_MINUTES}-minute AI interview`]}
                cta="Practice free"
                href={practiceSignupHref}
              />
              {packs.map((p) => (
                <PriceCard
                  key={p.id}
                  label={p.label}
                  badge={p.off > 0 ? `${p.badge ? `${p.badge} · ` : ""}−${EARLY_ACCESS_DISCOUNT_PERCENT}%` : p.badge}
                  price={money(p.price)}
                  was={p.off > 0 ? money(p.full) : undefined}
                  featured={p.id === "3pack"}
                  features={[
                    ...(p.credits > 1 ? [`${money(Math.round((p.price / p.credits) * 100) / 100)} per interview`] : []),
                    `${p.credits} × ${FULL_INTERVIEW_DURATION_MINUTES}-minute full interview${p.credits > 1 ? "s" : ""}`,
                    "Transcript and scored report",
                    p.credits > 1 ? "Progress tracking" : "Specific problem selection",
                  ]}
                  cta={`Buy ${p.label.toLowerCase()}`}
                  href={buyHref}
                />
              ))}
            </div>
            <div className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">
              One-time packs · No recurring billing · No card for free practice
            </div>
          </LandingReveal>
        </section>

        {/* ── 06 FAQ ── */}
        <section id="faq" className={cn("scroll-mt-20 py-[120px]", PAD)}>
          <LandingReveal className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-16">
            <div>
              <Eyebrow n="06">FAQ</Eyebrow>
              <h2 className={cn(H2, "max-w-[12ch]")}>Before your first round.</h2>
            </div>
            <div className="reveal-stagger border-t border-white/[0.08]">
              {FAQS.map((f, i) => (
                <details key={f.question} name="landing-faq" open={i === 0} className="group border-b border-white/[0.08]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-[19px] tracking-[-0.01em] transition-colors hover:text-brand-cyan [&::-webkit-details-marker]:hidden">
                    <span>{f.question}</span>
                    <span className="flex-none font-mono text-lg text-brand-cyan">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="pb-7 pr-12 text-pretty text-base leading-relaxed text-brand-muted group-open:animate-[soft-rise_0.35s_ease-out] motion-reduce:animate-none">{f.answer}</p>
                </details>
              ))}
            </div>
          </LandingReveal>
        </section>

        {/* ── Closing CTA ── */}
        <section className="overflow-hidden pt-[120px]">
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
          <LandingReveal className={cn("relative mx-auto max-w-[1320px] pb-[120px] pt-[140px]", PAD)}>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-[40%] -left-[15%] z-0 h-[80vw] max-h-[1200px] w-[80vw] max-w-[1200px] rounded-full bg-[radial-gradient(circle,rgb(var(--brand-cyan)/0.13)_0%,rgb(var(--brand-cyan)/0.05)_30%,transparent_60%)]"
            />
            <div className="relative mb-7 font-mono text-xs uppercase tracking-[0.14em] text-brand-cyan">[ Ready when you are ]</div>
            <h2 className="relative max-w-[16ch] text-balance text-[clamp(40px,6.4vw,96px)] font-normal leading-[0.98] tracking-[-0.045em]">
              Walk in already having heard yourself <span className="text-brand-subtle">answer hard questions.</span>
            </h2>
            <div className="relative mt-14 flex flex-wrap gap-3">
              <Link href={practiceSignupHref} className={BTN_PRIMARY}>
                Practice free <span aria-hidden className="font-mono">→</span>
              </Link>
              <Link href={previewSignupHref} className={BTN_GHOST}>
                Try a free {FREE_TRIAL_DURATION_MINUTES}-minute interview
              </Link>
            </div>
          </LandingReveal>
        </section>
    </MarketingShell>
  );
}

function PriceCard({
  label,
  badge,
  price,
  was,
  features,
  cta,
  href,
  featured = false,
}: {
  label: string;
  badge?: string;
  price: string;
  was?: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-7 rounded-[18px] border p-7 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0",
        featured
          ? "border-brand-cyan bg-brand-cyan/[0.04] shadow-[0_0_60px_rgb(var(--brand-cyan)/0.08)] hover:shadow-[0_0_80px_rgb(var(--brand-cyan)/0.16)]"
          : "border-white/[0.09] hover:border-white/[0.18]"
      )}
    >
      <div
        className={cn(
          "flex justify-between font-mono text-[11px] uppercase tracking-[0.12em]",
          featured ? "text-brand-cyan" : "text-brand-muted"
        )}
      >
        <span>{label}</span>
        {badge && <span>{badge}</span>}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-[56px] font-light leading-none tracking-[-0.05em]">{price}</span>
        {was && <span className="text-base text-brand-subtle line-through">{was}</span>}
      </div>
      <ul className="flex flex-1 flex-col gap-2.5 text-sm text-brand-muted">
        {features.map((f, i) => (
          <li key={f} className={cn(featured && i === 0 && "text-brand-text")}>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={cn(
          "rounded-full p-[13px] text-center text-sm transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97]",
          featured
            ? "bg-brand-cyan font-medium text-brand-deep hover:bg-brand-text"
            : "border border-white/[0.18] hover:border-brand-cyan hover:text-brand-cyan"
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
