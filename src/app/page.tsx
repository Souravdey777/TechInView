import Link from "next/link";
import { headers } from "next/headers";
import {
  Mic,
  Code2,
  BarChart3,
  ArrowRight,
  Zap,
  Target,
  Brain,
  Clock,
  Trophy,
  MessageSquare,
  Star,
  Volume2,
  Play,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";
import { getRegionForCountry } from "@/lib/constants";

type LandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const headersList = await headers();
  const country = (headersList.get("x-vercel-ip-country") ?? "US").toUpperCase();
  const pricingRegion = getRegionForCountry(country).region === "INR"
    ? "inr" as const
    : getRegionForCountry(country).region === "PPP"
      ? "ppp" as const
      : "usd" as const;

  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : undefined;
  const signupHref = ref ? `/signup?ref=${ref}` : "/login";

  return (
    <div className="min-h-screen bg-brand-deep text-brand-text overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-brand-deep/80 backdrop-blur-md border-b border-brand-border">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold font-heading text-brand-text tracking-tight">
              TechInView
            </span>
            <span className="text-brand-cyan text-2xl leading-none">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              FAQ
            </Link>
          </div>
          <Link
            href={signupHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(52,211,153,0.06) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-xs text-brand-cyan mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            AI-powered mock interviews &mdash; now in beta
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-brand-text mb-6 animate-fade-in">
            Stop guessing.
            <br />
            <span className="text-shimmer">Start interviewing.</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10 animate-fade-in stagger-1 leading-relaxed">
            Practice DSA problems with voice-powered AI interviewers that talk,
            listen, and score you like real engineers. Start with Tia, the
            generalist, or choose a FAANG-specific persona. 45 minutes.
            5-dimension feedback. Zero awkwardness.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
            <Link
              href={signupHref}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-cyan text-brand-deep font-semibold text-base hover:bg-cyan-300 transition-all hover:scale-105 glow-cyan"
            >
              Start Free Interview
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-brand-border text-brand-text font-semibold text-base hover:bg-brand-card transition-colors"
            >
              <Play className="w-4 h-4 text-brand-cyan" />
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-xs text-brand-muted animate-fade-in stagger-3">
            1 free trial interview &mdash; no credit card required
          </p>

          {/* ── Product Preview Mock ── */}
          <div className="mt-16 animate-fade-in stagger-4">
            <div className="relative mx-auto max-w-4xl rounded-xl border border-brand-border bg-brand-card/50 overflow-hidden shadow-2xl shadow-brand-cyan/5">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-border bg-brand-surface/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-brand-rose/60" />
                  <div className="w-3 h-3 rounded-full bg-brand-amber/60" />
                  <div className="w-3 h-3 rounded-full bg-brand-green/60" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="mx-auto max-w-sm h-6 rounded-md bg-brand-deep/80 border border-brand-border flex items-center justify-center">
                    <span className="text-[10px] text-brand-muted">techinview.ai/interview/abc-123</span>
                  </div>
                </div>
              </div>

              {/* Persona selector bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-brand-border bg-brand-deep/40">
                <span className="text-[10px] text-brand-muted mr-1">Interviewer:</span>
                {[
                  { name: "Tia", company: "Default", active: true },
                  { name: "Sundar", company: "Google", active: false },
                  { name: "Priya", company: "Meta", active: false },
                  { name: "James", company: "Amazon", active: false },
                  { name: "Sara", company: "Apple", active: false },
                  { name: "Dev", company: "Netflix", active: false },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                      p.active
                        ? "bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan"
                        : "border-brand-border text-brand-muted hover:border-brand-muted/50"
                    }`}
                  >
                    {p.name} <span className="opacity-60">({p.company})</span>
                  </div>
                ))}
              </div>

              {/* Mock interview room */}
              <div className="grid grid-cols-5 min-h-[320px] sm:min-h-[400px]">
                {/* Left: Voice + Problem panel */}
                <div className="col-span-2 border-r border-brand-border p-4 sm:p-6 flex flex-col gap-4">
                  {/* AI Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-cyan-600 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-text">Tia <span className="text-[10px] font-normal text-brand-muted">(Default)</span></p>
                      <p className="text-[10px] text-brand-green flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                        Speaking...
                      </p>
                    </div>
                  </div>
                  {/* Voice visualizer mock */}
                  <div className="flex items-end justify-center gap-[3px] h-8">
                    {[16, 24, 32, 20, 28, 36, 22, 30, 18, 26, 34, 20, 28, 24].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-brand-cyan/70 animate-voice-bar"
                        style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
                      />
                    ))}
                  </div>
                  {/* Transcript mock */}
                  <div className="flex-1 space-y-2.5 text-xs">
                    <div className="p-2 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20">
                      <p className="text-brand-cyan text-[10px] font-medium mb-0.5">Tia</p>
                      <p className="text-brand-text leading-relaxed">&ldquo;Walk me through your approach before you start coding.&rdquo;</p>
                    </div>
                    <div className="p-2 rounded-lg bg-brand-surface border border-brand-border">
                      <p className="text-brand-muted text-[10px] font-medium mb-0.5">You</p>
                      <p className="text-brand-text leading-relaxed">&ldquo;I&apos;d use a hash map to store values we&apos;ve seen...&rdquo;</p>
                    </div>
                  </div>
                </div>

                {/* Right: Code editor mock */}
                <div className="col-span-3 p-4 sm:p-6 flex flex-col gap-3">
                  {/* Editor tabs */}
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-md bg-brand-deep border border-brand-border text-[10px] text-brand-cyan font-mono">
                      solution.py
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-green/10 border border-brand-green/20">
                      <Clock className="w-3 h-3 text-brand-green" />
                      <span className="text-[10px] text-brand-green font-mono">32:14</span>
                    </div>
                  </div>
                  {/* Code */}
                  <div className="flex-1 rounded-lg bg-brand-deep/80 border border-brand-border p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-hidden">
                    <div className="space-y-0.5">
                      <p><span className="text-brand-muted">1</span>  <span className="text-brand-rose">def</span> <span className="text-brand-cyan">two_sum</span>(nums, target):</p>
                      <p><span className="text-brand-muted">2</span>      seen = {"{}"}</p>
                      <p><span className="text-brand-muted">3</span>      <span className="text-brand-rose">for</span> i, num <span className="text-brand-rose">in</span> <span className="text-brand-amber">enumerate</span>(nums):</p>
                      <p><span className="text-brand-muted">4</span>          complement = target - num</p>
                      <p><span className="text-brand-muted">5</span>          <span className="text-brand-rose">if</span> complement <span className="text-brand-rose">in</span> seen:</p>
                      <p><span className="text-brand-muted">6</span>              <span className="text-brand-rose">return</span> [seen[complement], i]</p>
                      <p><span className="text-brand-muted">7</span>          seen[num] = i<span className="typing-cursor">&nbsp;</span></p>
                    </div>
                  </div>
                  {/* Test results mock */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-green/20 text-brand-green">PASS</span>
                    <span className="text-[10px] text-brand-muted font-mono">Test 1: [2,7,11,15], target=9</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-green/20 text-brand-green">PASS</span>
                    <span className="text-[10px] text-brand-muted font-mono">Test 2: [3,2,4], target=6</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under the preview */}
            <div className="mx-auto max-w-2xl h-px bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent mt-8" />
          </div>
        </div>
      </section>

      {/* ── Social Proof Stats ── */}
      <section className="py-12 px-4 sm:px-6 border-y border-brand-border bg-brand-surface/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Mock interviews conducted", icon: MessageSquare },
            { value: "<1.5s", label: "Voice response latency", icon: Zap },
            { value: "4.8/5", label: "Average user rating", icon: Star },
            { value: "20+", label: "DSA problem categories", icon: Brain },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-cyan/10 mb-3">
                <stat.icon className="w-5 h-5 text-brand-cyan" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-brand-text">{stat.value}</p>
              <p className="text-xs text-brand-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features (6 cards, 2 rows) ── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-brand-deep">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-3 tracking-wide uppercase">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              Everything you need to land the offer
            </h2>
            <p className="text-brand-muted text-lg max-w-xl mx-auto">
              A complete interview simulation built for engineers who take
              preparation seriously.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Mic,
                color: "cyan",
                title: "Voice-powered AI interviewer",
                desc: "Speak naturally with your AI interviewer. Start with Tia (generalist) or pick a FAANG persona — each with a unique voice and interview style. Under 1.5s latency.",
              },
              {
                icon: Code2,
                color: "green",
                title: "Live code editor & execution",
                desc: "Full Monaco editor with syntax highlighting, autocompletion, and instant sandboxed code execution. Python, JavaScript, Java, and C++.",
              },
              {
                icon: BarChart3,
                color: "amber",
                title: "5-dimension scoring",
                desc: "Problem solving, code quality, communication, technical knowledge, and testing. Get a Hire/No-Hire verdict with actionable feedback.",
              },
              {
                icon: Brain,
                color: "rose",
                title: "Adaptive AI behavior",
                desc: "Each interviewer adapts to your level. They push back on suboptimal approaches, offer progressive hints when stuck, and ask follow-up questions.",
              },
              {
                icon: Target,
                color: "cyan",
                title: "FAANG-calibrated problems",
                desc: "20+ curated DSA problems across 10 categories tagged by company. Easy, medium, and hard — just like the real thing.",
              },
              {
                icon: Trophy,
                color: "green",
                title: "Progress tracking",
                desc: "Track scores over time, identify weak categories with a heatmap, and see your improvement trajectory across interviews.",
              },
            ].map((feature) => {
              const colorMap = {
                cyan: { bg: "bg-brand-cyan/10", text: "text-brand-cyan", border: "hover:border-brand-cyan/30" },
                green: { bg: "bg-brand-green/10", text: "text-brand-green", border: "hover:border-brand-green/30" },
                amber: { bg: "bg-brand-amber/10", text: "text-brand-amber", border: "hover:border-brand-amber/30" },
                rose: { bg: "bg-brand-rose/10", text: "text-brand-rose", border: "hover:border-brand-rose/30" },
              };
              const c = colorMap[feature.color as keyof typeof colorMap];
              return (
                <div
                  key={feature.title}
                  className={`glass-card p-7 flex flex-col gap-4 transition-all duration-300 ${c.border} hover:-translate-y-1`}
                >
                  <div className={`w-11 h-11 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <feature.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-base font-semibold text-brand-text">
                    {feature.title}
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-brand-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-3 tracking-wide uppercase">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              From zero to feedback in 3 steps
            </h2>
            <p className="text-brand-muted text-lg">
              No setup. No scheduling. Just start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px">
              <div className="h-full bg-gradient-to-r from-brand-cyan/40 via-brand-green/40 to-brand-amber/40" />
            </div>

            {[
              {
                step: "1",
                color: "cyan",
                title: "Pick your challenge",
                desc: "Choose difficulty, category, and language. Pick a specific problem or let us surprise you with a random one.",
                detail: "Arrays, Trees, DP, Graphs — 10 categories",
              },
              {
                step: "2",
                color: "green",
                title: "Interview with your AI",
                desc: "Use Tia the generalist, or pick a FAANG persona — Google, Meta, Amazon, Apple, or Netflix. 45-minute voice interview with live coding and follow-ups.",
                detail: "Real-time voice + live code execution",
              },
              {
                step: "3",
                color: "amber",
                title: "Get your scorecard",
                desc: "5-dimension radar chart, Hire/No-Hire verdict, full transcript, and a comparison of your code against the optimal solution.",
                detail: "Actionable feedback in under 30 seconds",
              },
            ].map((item) => {
              const colorMap = {
                cyan: { border: "border-brand-cyan", bg: "bg-brand-cyan/10", text: "text-brand-cyan" },
                green: { border: "border-brand-green", bg: "bg-brand-green/10", text: "text-brand-green" },
                amber: { border: "border-brand-amber", bg: "bg-brand-amber/10", text: "text-brand-amber" },
              };
              const c = colorMap[item.color as keyof typeof colorMap];
              return (
                <div key={item.step} className="glass-card p-7 flex flex-col items-center text-center gap-4">
                  <div className={`w-14 h-14 rounded-full border-2 ${c.border} ${c.bg} flex items-center justify-center ${c.text} font-bold text-xl relative z-10`}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-brand-text">
                    {item.title}
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    {item.desc}
                  </p>
                  <p className={`text-xs font-medium ${c.text} mt-auto`}>
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What Makes Us Different ── */}
      <section className="py-24 px-4 sm:px-6 bg-brand-deep">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-3 tracking-wide uppercase">Why TechInView</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              Not another LeetCode clone
            </h2>
            <p className="text-brand-muted text-lg max-w-xl mx-auto">
              Solving problems alone doesn&apos;t prepare you for the interview room. Communication does.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comparison card */}
            <div className="glass-card p-7">
              <p className="text-sm font-semibold text-brand-muted mb-5 uppercase tracking-wide">Traditional prep</p>
              <ul className="space-y-3">
                {[
                  "Solve problems in silence",
                  "No feedback on communication",
                  "Self-grade with no rubric",
                  "No time pressure simulation",
                  "Hope you can explain your code",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-brand-muted">
                    <span className="mt-0.5 text-brand-muted">&times;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-7 border-brand-cyan/30 glow-cyan">
              <p className="text-sm font-semibold text-brand-cyan mb-5 uppercase tracking-wide">TechInView</p>
              <ul className="space-y-3">
                {[
                  "Talk through your approach out loud",
                  "AI evaluates how well you communicate",
                  "5-dimension FAANG-calibrated scoring",
                  "Real 45-minute countdown with phase transitions",
                  "Instant feedback with Hire/No-Hire verdict",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-brand-text">
                    <span className="mt-0.5 text-brand-green">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <Pricing defaultRegion={pricingRegion} refParam={ref} />

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 sm:px-6 bg-brand-deep">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-3 tracking-wide uppercase">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How realistic is the AI interviewer?",
                a: "Each AI persona follows the interview structure used at its respective company — intro, problem presentation, clarification, approach discussion, coding, testing, and complexity analysis. They adapt to your responses and push back when needed.",
              },
              {
                q: "What programming languages are supported?",
                a: "Python, JavaScript, Java, and C++. Code runs in a sandboxed environment with instant feedback on test cases.",
              },
              {
                q: "How long does each interview take?",
                a: "Paid interviews are 45 minutes — the standard length for a real FAANG coding round. Free trial interviews are 20 minutes.",
              },
              {
                q: "Do credits expire?",
                a: "No. Credits never expire. Buy them when you need them, use them whenever you're ready.",
              },
              {
                q: "Can I use this on my phone?",
                a: "The landing page is mobile-friendly, but the interview room requires a desktop browser with a microphone for the best experience.",
              },
              {
                q: "How is the scoring done?",
                a: "After each interview, our AI evaluates you across 5 dimensions: problem solving (30%), code quality (25%), communication (20%), technical knowledge (15%), and testing (10%). You get an overall score, a Hire/No-Hire recommendation, and detailed feedback for each dimension.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group glass-card overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-brand-text font-medium text-sm hover:text-brand-cyan transition-colors list-none">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-brand-muted transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-brand-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 sm:px-6 bg-brand-surface relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.08) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-brand-text mb-6 leading-tight">
            Your next interview is
            <br />
            <span className="text-gradient-cyan">45 minutes away</span>
          </h2>
          <p className="text-brand-muted text-lg mb-10 max-w-lg mx-auto">
            No scheduling, no awkward peer matching, no waiting. Just you, your AI interviewer, and a problem to solve.
          </p>
          <Link
            href={signupHref}
            className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-brand-cyan text-brand-deep font-semibold text-lg hover:bg-cyan-300 transition-all hover:scale-105 glow-cyan"
          >
            Start Your Free Interview
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-xs text-brand-muted">
            No credit card required &mdash; try it right now
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-4 sm:px-6 border-t border-brand-border bg-brand-deep">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-1">
              <span className="font-bold font-heading text-brand-text">
                TechInView
              </span>
              <span className="text-brand-cyan text-xl leading-none">.</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-brand-muted">
              <Link href="#features" className="hover:text-brand-text transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-brand-text transition-colors">Pricing</Link>
              <Link href="#faq" className="hover:text-brand-text transition-colors">FAQ</Link>
            </div>

            <p className="text-brand-muted text-sm">
              &copy; {new Date().getFullYear()} TechInView. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
