import Link from "next/link";
import { headers } from "next/headers";
import { InterviewRoomDemo, PhaseTimeline, ScoreCard } from "@/components/landing/LandingLive";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import "./landing.css";
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
  { name: "Problem solving", short: "Problem solving", score: 84 },
  { name: "Code quality", short: "Code quality", score: 76 },
  { name: "Communication", short: "Communication", score: 90 },
  { name: "Technical knowledge", short: "Tech knowledge", score: 71 },
  { name: "Testing", short: "Testing", score: 62 },
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

  const fromPrice = Math.min(...packs.map((p) => p.price));

  return (
    <MarketingShell loginHref={loginHref} signupHref={practiceSignupHref}>
      <div className="hm">
        {/* Hero: Banner. The room starts right under it, above the fold. */}
        <header className="hm-hero">
          <div className="container hm-hero__grid">
            <h1>Practice the interview, not just the problem.</h1>
            <div className="hm-hero__side">
              <p className="lead">A voice interviewer that reads your code and pushes back.</p>
              <div className="hm-actions">
                <Link href={practiceSignupHref} className="hm-btn">
                  Practice free
                </Link>
                <Link href={previewSignupHref} className="hm-btn hm-btn--quiet">
                  Try a free {FREE_TRIAL_DURATION_MINUTES}-minute interview
                </Link>
              </div>
              <p className="small">
                DSA practice is free, no card. Full {FULL_INTERVIEW_DURATION_MINUTES}-minute interviews from{" "}
                <span className="num">{money(fromPrice)}</span>.
              </p>
            </div>
          </div>
        </header>

        {/* The room */}
        <section id="room" className="hm-room">
          <div className="container">
            <h2 className="hm-room__head">The interviewer on one side. Your code on the other.</h2>
            <InterviewRoomDemo name={INTERVIEWER.name} />
          </div>
        </section>

        {/* Why practice out loud: the head pinned, the four points scrolling past it */}
        <section id="features" className="hm-stack scroll-mt-20">
          <div className="container hm-stack__grid">
            <div className="hm-stack__pin">
              <h2>LeetCode trains answers. Interviews test signal.</h2>
              <p className="body">
                Plenty of people who fail a coding round could have solved the problem at home. They went quiet, skipped
                the clarifying questions, coded into a dead end, or never tested. Those habits only show up when someone
                is listening.
              </p>
            </div>
            <ul className="hm-stack__list">
              {GAPS.map((g) => (
                <li key={g.title} className="hm-stack__item">
                  <h3>{g.title}</h3>
                  <p>{g.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How a round runs */}
        <section id="how-it-works" className="hm-round scroll-mt-20">
          <div className="container">
            <div className="hm-round__head">
              <h2>{FULL_INTERVIEW_DURATION_MINUTES} minutes, nine phases, from intro to wrap-up.</h2>
            </div>
            <PhaseTimeline />
          </div>
        </section>

        {/* After the round */}
        <section id="score" className="hm-score">
          <div className="container">
            <ScoreCard
              dims={SAMPLE_DIMS}
              overall={77}
              interviewerName={INTERVIEWER.name}
              header={
                <>
                  <h2>Scored on five dimensions, with notes on each.</h2>
                  <p className="body hm-score__line">
                    An overall score out of 100, a hire recommendation, written feedback per dimension and the full
                    transcript. Behavioral and Engineering Manager rounds add a competency report graded against the
                    value lens you picked.
                  </p>
                </>
              }
              footer={
                <p className="hm-score__more">
                  <Link href="/how-ai-evaluates" className="hm-link">
                    How we score a round
                  </Link>
                </p>
              }
            />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="hm-price scroll-mt-20">
          <div className="container">
            <div className="hm-price__head">
              <h2>Interview packs, not a subscription.</h2>
              <div>
                <p className="body">
                  DSA practice is free. Pay once for full {FULL_INTERVIEW_DURATION_MINUTES}-minute AI interviews and use
                  each credit on a coding, Technical Q&amp;A, Engineering Manager or Behavioral round.
                </p>
                {spotsLeft > 0 && (
                  <p className="hm-price__early">
                    Early access: {EARLY_ACCESS_DISCOUNT_PERCENT}% off the first {EARLY_ACCESS_PURCHASE_LIMIT} purchases.{" "}
                    {spotsLeft} left.
                  </p>
                )}
              </div>
            </div>
            <table className="hm-table">
              <thead>
                <tr>
                  <th scope="col">Pack</th>
                  <th scope="col">Price</th>
                  <th scope="col">What you get</th>
                  <th scope="col">
                    <span className="sr-only">Buy</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <PriceRow
                  label="Free practice"
                  price={money(0)}
                  features={["Curated DSA problem set", "Run Python or JS, progress saved", `One free ${FREE_TRIAL_DURATION_MINUTES}-minute AI interview`]}
                  cta="Practice free"
                  href={practiceSignupHref}
                />
                {packs.map((p) => (
                  <PriceRow
                    key={p.id}
                    label={p.label}
                    badge={p.off > 0 ? [p.badge, `−${EARLY_ACCESS_DISCOUNT_PERCENT}% early access`].filter(Boolean).join(", ") : p.badge}
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
              </tbody>
            </table>
            <p className="small hm-price__terms">
              One-time packs with no recurring billing. No card needed for free practice.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="hm-faq scroll-mt-20">
          <div className="container hm-faq__grid">
            <h2>Before your first round.</h2>
            <div>
              {FAQS.map((f, i) => (
                <details key={f.question} name="landing-faq" open={i === 0} className="hm-faq__item">
                  <summary className="hm-faq__q">
                    <span>{f.question}</span>
                    <span aria-hidden className="hm-faq__sign">
                      +
                    </span>
                  </summary>
                  <p className="hm-faq__a">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Close: the hero's action again */}
        <section className="hm-close">
          <div className="container hm-close__grid">
            <h2>Walk in already having heard yourself answer hard questions.</h2>
            <div className="hm-actions">
              <Link href={practiceSignupHref} className="hm-btn">
                Practice free
              </Link>
              <Link href={previewSignupHref} className="hm-btn hm-btn--quiet">
                Try a free {FREE_TRIAL_DURATION_MINUTES}-minute interview
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

function PriceRow({
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
    <tr className={cn(featured && "is-featured")}>
      <td>
        <span className="hm-table__pack">{label}</span>
        {badge && <span className="hm-table__badge">{badge}</span>}
      </td>
      <td>
        <span className="hm-table__price">{price}</span>
        {was && (
          <span className="hm-table__was">
            <span className="sr-only">Was </span>
            {was}
          </span>
        )}
      </td>
      <td>
        <ul className="hm-table__feat">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </td>
      <td>
        <Link href={href} className={cn("hm-btn", !featured && "hm-btn--quiet")}>
          {cta}
        </Link>
      </td>
    </tr>
  );
}
