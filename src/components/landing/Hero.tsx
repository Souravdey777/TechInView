"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const ctaHref = refParam ? `/signup?ref=${refParam}` : "/login";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-24 pb-32 px-6"
    >
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(52,211,153,0.06) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      <div
        className="relative max-w-4xl mx-auto text-center transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border bg-brand-card/60 text-xs text-brand-muted mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
          Voice-powered AI interviewer
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-brand-text mb-6">
          Ace your next{" "}
          <span className="text-gradient-cyan">coding interview</span>
        </h1>

        <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10">
          Practice DSA problems with Tia, your AI interviewer. Real-time voice
          interaction, live code editor, and FAANG-calibrated scoring &mdash;
          all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={ctaHref}
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

        <p className="mt-5 text-xs text-brand-muted">
          1 free interview per week &mdash; no credit card required
        </p>
      </div>
    </section>
  );
}
