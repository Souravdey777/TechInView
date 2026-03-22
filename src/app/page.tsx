import Link from "next/link";
import { Mic, Code2, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-brand-deep/80 backdrop-blur-md border-b border-brand-border">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
              href="#pricing"
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              Pricing
            </Link>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(52,211,153,0.06) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border bg-brand-card/60 text-xs text-brand-muted mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Voice-powered AI interviewer
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-brand-text mb-6 animate-fade-in">
            Ace your next{" "}
            <span className="text-gradient-cyan">coding interview</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10 animate-fade-in">
            Practice DSA problems with Alex, your AI interviewer. Real-time
            voice interaction, live code editor, and FAANG-calibrated scoring —
            all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-brand-cyan text-brand-deep font-semibold text-base hover:bg-cyan-300 transition-all hover:scale-105 glow-cyan"
            >
              Start Free Interview
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-brand-border text-brand-text font-semibold text-base hover:bg-brand-card transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-5 text-xs text-brand-muted animate-fade-in">
            1 free interview per week — no credit card required
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-brand-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              Everything you need to land the job
            </h2>
            <p className="text-brand-muted text-lg max-w-xl mx-auto">
              A complete interview simulation built for engineers who take
              preparation seriously.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-8 flex flex-col gap-4 hover:border-brand-cyan/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                <Mic className="w-6 h-6 text-brand-cyan" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Voice-powered AI interviewer
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Speak naturally with Alex, your AI interviewer. Real-time STT
                and TTS create an authentic conversational interview experience
                with under 1.5s latency.
              </p>
            </div>
            <div className="glass-card p-8 flex flex-col gap-4 hover:border-brand-cyan/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <Code2 className="w-6 h-6 text-brand-green" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Live code editor
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Full Monaco editor with syntax highlighting, autocompletion, and
                instant code execution. Supports Python, JavaScript, Java, and
                C++.
              </p>
            </div>
            <div className="glass-card p-8 flex flex-col gap-4 hover:border-brand-cyan/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-brand-amber" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                FAANG-calibrated scoring
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                5-dimension evaluation: problem solving, code quality,
                communication, technical knowledge, and testing. Get a Hire /
                No-Hire verdict with detailed feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-brand-deep">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              How it works
            </h2>
            <p className="text-brand-muted text-lg">
              From setup to feedback in under an hour.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-brand-cyan bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold text-xl relative z-10">
                1
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Choose your problem
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Select difficulty, category, and programming language. Pick a
                problem or let us randomize one for you.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-brand-green bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xl relative z-10">
                2
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Interview with Alex
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Conduct a full 45-minute mock interview. Discuss your approach
                verbally, write code in the editor, and answer follow-up
                questions.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-brand-amber bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-xl relative z-10">
                3
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Get detailed feedback
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Review your score breakdown, read the full transcript, compare
                your code to the optimal solution, and track your progress over
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-brand-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-brand-muted text-lg">
              Start free, upgrade when you&apos;re ready.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Starter */}
            <div className="glass-card p-8 flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-brand-text mb-1">
                  Starter
                </h3>
                <p className="text-brand-muted text-sm">
                  For consistent practice
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-text">$19</span>
                <span className="text-brand-muted">/month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> 10 interviews per
                  month
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Full AI feedback &
                  scoring
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> All 4 languages
                  (Python, JS, Java, C++)
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Progress tracking
                  & history
                </li>
                <li className="flex items-center gap-2 text-brand-muted">
                  <span className="text-brand-muted">–</span> Company-specific
                  personas
                </li>
              </ul>
              <Link
                href="/login"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-brand-border text-brand-text font-semibold hover:bg-brand-card transition-colors"
              >
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <div className="relative glass-card p-8 flex flex-col gap-6 border-brand-cyan/40 glow-cyan">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs font-semibold">
                  Most Popular
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-text mb-1">Pro</h3>
                <p className="text-brand-muted text-sm">For serious candidates</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-text">$29</span>
                <span className="text-brand-muted">/month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Unlimited
                  interviews
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Full AI feedback &
                  scoring
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> All 4 languages
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Progress tracking
                  & history
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Company-specific
                  personas (Google, Meta, Amazon...)
                </li>
                <li className="flex items-center gap-2 text-brand-text">
                  <span className="text-brand-green">✓</span> Priority support
                </li>
              </ul>
              <Link
                href="/login"
                className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-cyan text-brand-deep font-semibold hover:bg-cyan-300 transition-all hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
          <p className="text-center text-brand-muted text-sm mt-8">
            1 free interview per week — no card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-brand-border bg-brand-deep">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="font-bold font-heading text-brand-text">
              TechInView
            </span>
            <span className="text-brand-cyan text-xl leading-none">.</span>
          </div>
          <p className="text-brand-muted text-sm">
            Built by Sourav Dey &mdash; &copy; 2024 TechInView. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
