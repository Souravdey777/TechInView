import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  MessageSquare,
  Play,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { HowItWorksTimeline } from "@/components/landing/HowItWorksTimeline";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { LandingTiaPreview } from "@/components/landing/LandingTiaPreview";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { Pricing } from "@/components/landing/Pricing";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { getRegionForCountry } from "@/lib/constants";
import {
  INTERVIEWER_PERSONAS,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
import { cn } from "@/lib/utils";

type LandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Tone = "cyan" | "green" | "amber" | "rose";

type SignalCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: Tone;
};

type FaqItem = {
  question: string;
  answer: string;
};

const TONE_STYLES: Record<
  Tone,
  {
    badgeText: string;
    border: string;
    glow: string;
    solid: string;
    text: string;
    surface: string;
  }
> = {
  cyan: {
    badgeText: "text-brand-cyan",
    border: "border-brand-cyan/25",
    glow: "shadow-xl shadow-brand-cyan/10",
    solid: "bg-brand-cyan",
    text: "text-brand-cyan",
    surface: "bg-brand-cyan/10",
  },
  green: {
    badgeText: "text-brand-green",
    border: "border-brand-green/25",
    glow: "shadow-xl shadow-brand-green/10",
    solid: "bg-brand-green",
    text: "text-brand-green",
    surface: "bg-brand-green/10",
  },
  amber: {
    badgeText: "text-brand-amber",
    border: "border-brand-amber/25",
    glow: "shadow-xl shadow-brand-amber/10",
    solid: "bg-brand-amber",
    text: "text-brand-amber",
    surface: "bg-brand-amber/10",
  },
  rose: {
    badgeText: "text-brand-rose",
    border: "border-brand-rose/25",
    glow: "shadow-xl shadow-brand-rose/10",
    solid: "bg-brand-rose",
    text: "text-brand-rose",
    surface: "bg-brand-rose/10",
  },
};

const INTERVIEW_GAPS: readonly SignalCard[] = [
  {
    icon: MessageSquare,
    title: "Communication is part of the test",
    description:
      "Most prep only checks whether you can solve the problem. Real interviews also check how clearly you think out loud.",
    tone: "cyan",
  },
  {
    icon: Brain,
    title: "Weak approaches should get challenged",
    description:
      "A real interviewer pushes back when your plan is too slow, too vague, or missing edge cases. Silent practice never does.",
    tone: "rose",
  },
  {
    icon: Cpu,
    title: "You need a realistic loop",
    description:
      "The pressure comes from juggling voice, code, time, and testing together. That combined signal is what changes real outcomes.",
    tone: "green",
  },
  {
    icon: Sparkles,
    title: "Feedback should tell you what to fix next",
    description:
      "Every round ends with a scorecard that pinpoints whether you missed clarity, rigor, speed, testing, or clean execution.",
    tone: "amber",
  },
];

const PERSONA_SPOTLIGHT: Record<
  InterviewerPersonaId,
  {
    bestFor: string;
    tone: Tone;
    edge: string;
  }
> = {
  tia: {
    bestFor: "Best first round",
    tone: "cyan",
    edge: "Balanced signal with a FAANG-generalist bar",
  },
  google: {
    bestFor: "Clarity and structure",
    tone: "green",
    edge: "Rewards legible reasoning and deliberate tradeoffs",
  },
  meta: {
    bestFor: "Fast convergence",
    tone: "rose",
    edge: "Pushes hard on efficiency and iteration speed",
  },
  amazon: {
    bestFor: "Ownership and edge cases",
    tone: "amber",
    edge: "Tests robustness, assumptions, and test discipline",
  },
  apple: {
    bestFor: "Precision and polish",
    tone: "cyan",
    edge: "Looks for crisp communication and tidy execution",
  },
  netflix: {
    bestFor: "Senior-bar autonomy",
    tone: "green",
    edge: "Low handholding, high judgment, high signal density",
  },
};

const SAMPLE_RADAR_SCORES = [
  { dimension: "Problem Solving", score: 86, maxScore: 100 },
  { dimension: "Code Quality", score: 82, maxScore: 100 },
  { dimension: "Communication", score: 79, maxScore: 100 },
  { dimension: "Technical Knowledge", score: 84, maxScore: 100 },
  { dimension: "Testing", score: 76, maxScore: 100 },
] as const;

const FAQS: readonly FaqItem[] = [
  {
    question: "How realistic is the AI interviewer?",
    answer:
      "Each persona follows the structure of a real coding round: intro, clarification, approach discussion, coding, testing, complexity analysis, and wrap-up. The interviewer adapts to your responses and challenges weak choices instead of just cheering you on.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "Python, JavaScript, Java, and C++. Code runs in a sandboxed execution environment with test feedback during the round.",
  },
  {
    question: "How long does a session take?",
    answer:
      "Practice Mode is self-paced. AI Interview Mode runs for 45 minutes on paid rounds, and every account keeps one shorter 5-minute audio preview so you can feel the pressure before buying a pack.",
  },
  {
    question: "Do I need a subscription?",
    answer:
      "No. Free Practice Mode is always available for the curated DSA set. AI Interview Mode uses one-time interview packs, so you only buy the rounds you actually need.",
  },
  {
    question: "Can I use this on mobile?",
    answer:
      "The landing page is mobile-friendly, but the interview room is designed for desktop because voice, code, and feedback work best with a full screen and a microphone.",
  },
  {
    question: "What do I get after the round?",
    answer:
      "You get an overall score, a hire recommendation, a five-dimension breakdown, detailed feedback, and the transcript so you can review where the signal was strong or weak.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-bold leading-tight text-brand-text sm:text-4xl md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
        {description}
      </p>
    </div>
  );
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const headersList = headers();
  const country = (headersList.get("x-vercel-ip-country") ?? "US").toUpperCase();
  const region = getRegionForCountry(country).region;
  const pricingRegion =
    region === "INR" ? ("inr" as const) : region === "PPP" ? ("ppp" as const) : ("usd" as const);

  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : undefined;
  const buildAuthHref = (pathname: "/login" | "/signup", next?: string) => {
    const authParams = new URLSearchParams();
    if (ref) {
      authParams.set("ref", ref);
    }
    if (next) {
      authParams.set("next", next);
    }

    const query = authParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const loginHref = buildAuthHref("/login");
  const practiceSignupHref = buildAuthHref("/signup", "/interview/setup?dsaExperience=ai_interview");
  const previewSignupHref = buildAuthHref("/signup", "/interview/setup?dsaExperience=ai_interview");
  const defaultPersona = getInterviewerPersona("tia");

  return (
    <div className="min-h-screen [overflow-x:clip] bg-brand-deep text-brand-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep"
      >
        Skip to content
      </a>
      <MarketingNav loginHref={loginHref} signupHref={practiceSignupHref} />

      <main id="main">
        <section className="relative overflow-hidden px-4 pb-28 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
          <div className="landing-aurora absolute inset-0 opacity-90" aria-hidden />
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.28]" aria-hidden />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-deep via-brand-deep/80 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-14 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-cyan/[0.08] blur-3xl"
            aria-hidden
          />

          <LandingReveal className="relative mx-auto max-w-[92rem]">
            <div className="grid items-center gap-16 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:gap-20">
              <div className="max-w-3xl pt-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/[0.08] px-4 py-1.5 text-xs font-medium text-brand-cyan">
                  <span className="h-2 w-2 rounded-full bg-brand-cyan shadow-sm shadow-brand-cyan/30" />
                  Voice-first AI mock interviews for software engineers
                </div>

                <h1 className="mt-8 max-w-[12.5ch] text-balance text-5xl font-bold leading-[0.92] tracking-tight text-brand-text sm:text-6xl md:text-[5.7rem] xl:text-[6rem]">
                  Practice the interview, <span className="text-shimmer">not just the problem.</span>
                </h1>

                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-brand-muted sm:text-xl">
                  Start with free Practice Mode for DSA, then switch into AI Interview Mode when
                  you want the interviewer to speak, challenge your thinking, watch your code, and
                  score how you perform under pressure. {defaultPersona.name} is ready when you
                  want the real interview feel.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={practiceSignupHref}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-7 py-4 text-base font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
                  >
                    Practice Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={previewSignupHref}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-7 py-4 text-base font-semibold text-brand-text transition-colors hover:border-brand-cyan/30 hover:bg-brand-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
                  >
                    <Play className="h-4 w-4 text-brand-cyan" />
                    Try 5-Minute Audio Interview
                  </Link>
                </div>

                <p className="mt-5 text-sm text-brand-muted">
                  Free DSA practice with saved progress. One 5-minute audio preview included.
                </p>

                <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-muted">
                  {[
                    "Voice interviewers that actually push back",
                    "Live coding with execution in the round",
                    "Actionable scorecards after every session",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="landing-panel relative p-6 lg:p-8">
                <div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                      Interview Room
                    </p>
                    <h2 className="mt-2 max-w-lg text-lg font-semibold text-brand-text sm:text-[1.6rem] sm:leading-tight">
                      Voice, live code, and feedback in one calm workspace.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {INTERVIEWER_PERSONAS.map((persona) => (
                    <span
                      key={persona.id}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-medium",
                        persona.id === "tia"
                          ? "border-brand-cyan/[0.35] bg-brand-cyan/[0.12] text-brand-cyan"
                          : "border-brand-border bg-brand-surface text-brand-muted"
                      )}
                    >
                      {persona.name} ({persona.companyLabel})
                    </span>
                  ))}
                </div>

                <div className="mt-7 rounded-3xl border border-brand-border bg-brand-surface/80 p-4 lg:p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
                    <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
                      <LandingTiaPreview />
                      <div className="mt-5 rounded-2xl border border-brand-cyan/[0.15] bg-brand-cyan/[0.05] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                          Live prompt
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                          &quot;Talk me through the brute force first, then tell me how you would get
                          it to O(n). I care about how you reason, not just the final answer.&quot;
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="rounded-2xl border border-brand-border bg-brand-card p-5 lg:h-full">
                        <div className="flex items-center justify-between gap-3">
                          <div className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1 font-mono text-[11px] text-brand-cyan">
                            solution.py
                          </div>
                          <div className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-[11px] font-semibold text-brand-green">
                            2/2 tests passing
                          </div>
                        </div>
                        <div className="mt-5 space-y-1 rounded-2xl border border-brand-border bg-brand-surface p-5 font-mono text-[11px] leading-relaxed text-brand-text sm:text-xs">
                          <p>
                            <span className="text-brand-muted">1</span>{" "}
                            <span className="text-brand-rose">def</span>{" "}
                            <span className="text-brand-cyan">two_sum</span>(nums, target):
                          </p>
                          <p>
                            <span className="text-brand-muted">2</span> &nbsp;&nbsp;&nbsp;&nbsp;seen
                            = {"{}"}
                          </p>
                          <p>
                            <span className="text-brand-muted">3</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            <span className="text-brand-rose">for</span> i, num{" "}
                            <span className="text-brand-rose">in</span>{" "}
                            <span className="text-brand-amber">enumerate</span>(nums):
                          </p>
                          <p>
                            <span className="text-brand-muted">4</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            complement = target - num
                          </p>
                          <p>
                            <span className="text-brand-muted">5</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            <span className="text-brand-rose">if</span> complement{" "}
                            <span className="text-brand-rose">in</span> seen:
                          </p>
                          <p>
                            <span className="text-brand-muted">6</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-brand-rose">return</span>{" "}
                            [seen[complement], i]
                          </p>
                          <p>
                            <span className="text-brand-muted">7</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            seen[num] = i<span className="typing-cursor">&nbsp;</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </LandingReveal>
        </section>

        <section id="features" className="bg-brand-surface/[0.65] px-4 py-24 sm:px-6">
          <LandingReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
              <div>
                <SectionHeading
                  eyebrow="What Changes Here"
                  title="LeetCode trains answers. Interviews test signal."
                  description="The hard part of real interviews is not just the solution. It is explaining the plan, surviving pushback, coding clearly, and still sounding composed when the clock is moving."
                  align="left"
                />

                <div className="mt-8 rounded-3xl border border-brand-border bg-brand-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                    Why silent practice falls short
                  </p>
                  <div className="mt-5 space-y-4">
                    {[
                      "You never have to explain tradeoffs while you think.",
                      "No one challenges a slow or fuzzy approach in real time.",
                      "Testing often becomes optional instead of part of the evaluation.",
                      "You do not feel the pressure of voice + code + time all at once.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-rose/20 bg-brand-rose/10 text-brand-rose">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm leading-relaxed text-brand-muted">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {INTERVIEW_GAPS.map((card) => {
                  const style = TONE_STYLES[card.tone];
                  return (
                    <div
                      key={card.title}
                      className={cn(
                        "landing-panel p-6",
                        style.border,
                        style.glow,
                      )}
                    >
                      <div
                        className={cn(
                          "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                          style.surface,
                          style.badgeText,
                        )}
                      >
                        <card.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-brand-text">{card.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </LandingReveal>
        </section>

        <section id="how-it-works" className="relative [overflow-x:clip] bg-brand-deep px-4 py-24 sm:px-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-cyan/[0.06] to-transparent"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <SectionHeading
                  eyebrow="How It Works"
                  title="A full interview arc, not a chatbot demo."
                  description="Each round moves through the same moments that matter in a real technical screen: understanding the problem, choosing the approach, coding clearly, validating edge cases, and defending complexity."
                  align="left"
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Bot,
                      title: "Adaptive interviewer behavior",
                      description:
                        "If you stall, the interviewer can nudge. If your plan is weak, it pushes back. If your answer is strong, it raises the bar.",
                      tone: "cyan" as const,
                    },
                    {
                      icon: Zap,
                      title: "Built for repetition",
                      description:
                        "Start on demand, finish with a concrete report, then run another round without scheduling anyone or waiting for feedback.",
                      tone: "green" as const,
                    },
                  ].map((card) => {
                    const style = TONE_STYLES[card.tone];
                    return (
                      <div
                        key={card.title}
                        className="rounded-2xl border border-brand-border bg-brand-card p-5"
                      >
                        <div
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                            style.surface,
                            style.badgeText,
                          )}
                        >
                          <card.icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-brand-text">{card.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <HowItWorksTimeline />
            </div>
          </div>
        </section>

        <section className="bg-brand-surface px-4 py-24 sm:px-6">
          <LandingReveal className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Meet The Interviewers"
              title="From warm generalist to company-specific pressure."
              description="Start with Tia when you want a balanced bar. Switch personas when you want practice that feels closer to a Google, Meta, Amazon, Apple, or Netflix-style round."
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {INTERVIEWER_PERSONAS.map((persona) => {
                const spotlight = PERSONA_SPOTLIGHT[persona.id];
                const style = TONE_STYLES[spotlight.tone];

                return (
                  <div
                    key={persona.id}
                    className={cn(
                      "landing-panel p-6",
                      style.border,
                      style.glow,
                      persona.id === "tia" && "ring-1 ring-brand-cyan/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
                          {persona.companyLabel}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-brand-text">
                          {persona.name}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold",
                          style.border,
                          style.surface,
                          style.badgeText,
                        )}
                      >
                        {spotlight.bestFor}
                      </span>
                    </div>

                    <p className="mt-5 text-sm font-medium text-brand-text">
                      {persona.shortStyleSummary}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                      {spotlight.edge}
                    </p>
                    <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                        Sample opener
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                        {persona.greeting}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </LandingReveal>
        </section>

        <section id="scorecard" className="bg-brand-deep px-4 py-24 sm:px-6">
          <LandingReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
              <div>
                <SectionHeading
                  eyebrow="After The Round"
                  title="See your 5-dimension interview profile at a glance."
                  description="Instead of guessing how the round went, you get one clear performance view across the five signals that matter most in technical interviews."
                  align="left"
                />

                <div className="mt-8 space-y-4">
                  {[
                    "Problem solving",
                    "Code quality",
                    "Communication",
                    "Technical knowledge",
                    "Testing",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-relaxed text-brand-muted">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/how-ai-evaluates"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-6 py-3 text-sm font-semibold text-brand-text transition-colors hover:border-brand-cyan/30 hover:bg-brand-card"
                  >
                    Learn how scoring works
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={previewSignupHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-6 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
                  >
                    Try 5-Minute Audio Interview
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="landing-panel p-4 sm:p-5">
                <div className="rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                        5D Preview
                      </p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-brand-text">
                        Performance Breakdown
                      </h3>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted">
                      {defaultPersona.name} &middot; Sample round
                    </span>
                  </div>

                  <ScoreRadar scores={[...SAMPLE_RADAR_SCORES]} />
                </div>
              </div>
            </div>
          </LandingReveal>
        </section>

        <LandingReveal>
          <Pricing defaultRegion={pricingRegion} refParam={ref} />
        </LandingReveal>

        <section id="faq" className="bg-brand-surface px-4 py-24 sm:px-6">
          <LandingReveal className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions before your first round."
              description="If you are wondering whether this is realistic enough, long enough, or useful enough, these are usually the questions people ask before they try the first session."
            />

            <div className="mx-auto mt-12 max-w-4xl space-y-4">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group landing-panel overflow-hidden p-0">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left text-sm font-semibold text-brand-text transition-colors hover:text-brand-cyan list-none">
                    {faq.question}
                    <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-brand-muted">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </LandingReveal>
        </section>

        <section className="relative overflow-hidden px-4 py-24 sm:px-6">
          <div className="landing-aurora absolute inset-0 opacity-80" aria-hidden />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-cyan/[0.08] to-transparent"
            aria-hidden
          />

          <LandingReveal className="relative mx-auto max-w-5xl">
            <div className="landing-panel px-6 py-10 text-center sm:px-10 sm:py-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                Ready when you are
              </div>
              <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-bold leading-tight text-brand-text sm:text-4xl md:text-5xl">
                Walk into the real interview already having heard yourself answer hard questions.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-muted">
                No scheduling. No awkward peer pairing. Just a real-feeling coding round, a live
                interviewer, and feedback that tells you what to sharpen next.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={practiceSignupHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-7 py-4 text-base font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
                >
                  Practice Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={previewSignupHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-7 py-4 text-base font-semibold text-brand-text transition-colors hover:border-brand-cyan/30 hover:bg-brand-card"
                >
                  Try 5-Minute Audio Interview
                </Link>
              </div>

              <p className="mt-4 text-sm text-brand-muted">
                Practice free now, then unlock full AI interview packs when you are ready.
              </p>
            </div>
          </LandingReveal>
        </section>
      </main>

      <MarketingFooter signupHref={practiceSignupHref} />
    </div>
  );
}
