"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceVisualizer, type VoiceState } from "@/components/interview/VoiceVisualizer";
import { cn } from "@/lib/utils";

/*
 * Interactive pieces of the landing page. Everything here shares one clock
 * (performance.now) so the hero orb, the status line and the room orb agree
 * on what "Tia" is doing. Both orbs are the real interview-room
 * VoiceVisualizer; the hero canvas only draws the dot grid.
 */

// Accent comes from the --brand-cyan token so the landing theme can re-skin it.
const ACCENT = (alpha = 1) => `rgb(var(--brand-cyan) / ${alpha})`;

// One conversational turn every ~12.6s: Tia speaks, then listens, then thinks
// briefly before answering. Shared by the orbs and the status lines.
const TURN_START = Math.PI + Math.asin(0.35);
const TURN_END = 2 * Math.PI - Math.asin(0.35);
function orbStateAt(t: number): VoiceState {
  const a = (((t * 0.5) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (a < TURN_START || a > TURN_END) return "speaking";
  return (a - TURN_START) / (TURN_END - TURN_START) > 0.65 ? "thinking" : "listening";
}
const STATE_LABEL: Record<VoiceState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

/** The interviewer's current state on the shared clock, updated a few times a second. */
function useOrbState() {
  const [state, setState] = useState<VoiceState>("speaking");
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setState(orbStateAt(performance.now() / 1000)), 200);
    return () => window.clearInterval(id);
  }, []);
  return state;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fitCanvas(c: HTMLCanvasElement) {
  const d = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.clientWidth;
  const h = c.clientHeight;
  if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) {
    c.width = Math.round(w * d);
    c.height = Math.round(h * d);
  }
  const x = c.getContext("2d")!;
  x.setTransform(d, 0, 0, d, 0, 0);
  x.clearRect(0, 0, w, h);
  return [x, w, h] as const;
}

/** Runs `draw(seconds)` every frame while the canvas is on screen; once if reduced motion. */
function useCanvasLoop(ref: React.RefObject<HTMLCanvasElement>, draw: (c: HTMLCanvasElement, t: number) => void) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (prefersReducedMotion()) {
      drawRef.current(c, 2);
      return;
    }
    let raf = 0;
    let visible = true;
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (visible) drawRef.current(c, ts / 1000);
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [ref]);
}

// VoiceVisualizer's orb body is 76px; it is scaled up to the ring size.
const ORB_PX = 76;

export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.tx = e.clientX / window.innerWidth - 0.5;
      mouse.current.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useCanvasLoop(ref, (c) => {
    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.05;
    m.y += (m.ty - m.y) * 0.05;
    const [x, w, h] = fitCanvas(c);

    x.fillStyle = "rgba(255,255,255,0.07)";
    for (let gx = 16; gx < w; gx += 32) for (let gy = 16; gy < h; gy += 32) x.fillRect(gx, gy, 1, 1);

    const wide = w > 900;
    const cx = (wide ? w * 0.72 : w * 0.5) + m.x * 30;
    const cy = (wide ? h * 0.44 : h * 0.26) + m.y * 30;
    const R = Math.min(wide ? h * 0.2 : w * 0.24, 200);
    if (orbRef.current) {
      const scale = (R * 1.8) / ORB_PX;
      orbRef.current.style.transform = `translate(${cx - ORB_PX / 2}px, ${cy - ORB_PX / 2}px) scale(${scale})`;
      orbRef.current.style.opacity = "0.55";
    }
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
      <div ref={orbRef} className="absolute left-0 top-0 h-[76px] w-[76px] opacity-0 brightness-125 transition-opacity duration-700">
        <VoiceVisualizer state="speaking" followCursor className="h-[76px] w-[76px]" />
      </div>
    </div>
  );
}

/** "Tia · Speaking · 00:05" under the hero, whose orb always shows the speaking (green) state. */
export function LiveStatus({ name }: { name: string }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setSecs(Math.floor((performance.now() - start) / 1000)), 250);
    return () => window.clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="flex items-center gap-2.5 text-brand-text">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
      {name} · {STATE_LABEL.speaking} · {pad(Math.floor(secs / 60) % 60)}:{pad(secs % 60)}
    </span>
  );
}

const CODE = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`;

export function InterviewRoomDemo({ name }: { name: string }) {
  const [typed, setTyped] = useState(0);
  const orbState = useOrbState();
  const codeRef = useRef<HTMLDivElement>(null);

  // Type the solution while the editor is visible; pause 5s when done, then restart.
  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setTyped(CODE.length);
      return;
    }
    let visible = false;
    let doneAt = 0;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const id = window.setInterval(() => {
      if (!visible) return;
      setTyped((n) => {
        if (n < CODE.length) {
          doneAt = Date.now();
          return Math.min(CODE.length, n + (CODE[n] === " " ? 4 : 1));
        }
        return Date.now() - doneAt > 5000 ? 0 : n;
      });
    }, 38);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);


  const done = typed >= CODE.length;
  const typedLines = CODE.slice(0, typed).split("\n");

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.09] bg-brand-surface">

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div className="flex flex-col gap-8 border-white/[0.07] p-6 sm:p-10 md:border-r">
          <div className="flex items-center gap-4">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-brand-cyan/50 text-lg text-brand-cyan">
              {name[0]}
            </div>
            <div>
              <div className="text-lg tracking-tight">
                {name}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-muted">
                AI interviewer · {STATE_LABEL[orbState]}
              </div>
            </div>
          </div>
          <div aria-hidden className="flex h-60 w-full items-center justify-center">
            <div className="scale-[1.7]">
              <VoiceVisualizer state={orbState} followCursor className="h-[76px] w-[76px]" />
            </div>
          </div>
          <div>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">Live prompt</div>
            <p className="text-pretty text-lg leading-snug tracking-tight sm:text-[22px]">
              “Talk me through the brute force first, then tell me how you would get it to O(n). I care about how you
              reason, not just the final answer.”
            </p>
          </div>
        </div>

        <div ref={codeRef} className="flex flex-col bg-[#0B0C0F]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5 font-mono text-xs text-brand-muted">
            <span>solution.py</span>
            {done ? <span className="text-brand-cyan">● 2/2 tests passing</span> : <span>○ running 0/2</span>}
          </div>
          <pre className="flex-1 overflow-x-auto px-5 py-6 font-mono text-sm leading-[1.9] text-[#D5D8DC]">
            {CODE.split("\n").map((_, i) => (
              <div key={i} className="flex min-h-[26px] gap-5">
                <span className="w-3.5 flex-none text-right text-[#3E434A]">{i + 1}</span>
                <span className="whitespace-pre">
                  {typedLines[i] ?? ""}
                  {i === typedLines.length - 1 && (
                    <span className="ml-0.5 inline-block h-[17px] w-2 translate-y-[3px] bg-brand-cyan" aria-hidden />
                  )}
                </span>
              </div>
            ))}
          </pre>
          <div className="flex justify-between border-t border-white/[0.07] px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-subtle">
            <span>Phase 5 · Coding</span>
            <span>Python · JavaScript</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PHASES = [
  { s: 0, e: 1, label: "Introduction", title: "Quick intro and bar setting", sub: "Tone, confidence, and clarity get judged immediately.", body: "The interviewer asks about your background and sets the tone: this is a real screen, and hints are limited." },
  { s: 1, e: 2, label: "Problem", title: "The problem is delivered live", sub: "Absorb the prompt and stay conversational under pressure.", body: "You hear the prompt, examples, and constraints the way you would in a live round. Enough to start reasoning, not enough to skip the thinking." },
  { s: 2, e: 5, label: "Clarification", title: "Clarify assumptions before you commit", sub: "Good questions shrink the solution space early.", body: "Strong candidates de-risk ambiguity, confirm edge conditions, and frame the problem before touching the keyboard." },
  { s: 5, e: 12, label: "Approach", title: "Explain the approach and defend it", sub: "Reasoning quality matters as much as the code.", body: "Walk through the plan, tradeoffs, and data structures. If the path is weak, the interviewer pushes back before you code into a dead end." },
  { s: 12, e: 32, label: "Coding", title: "Code while the interviewer listens", sub: "You talk and type at the same time.", body: "The long execution stretch: narrate key decisions, keep momentum, and recover cleanly if you hit a bug or change direction." },
  { s: 32, e: 37, label: "Testing", title: "Trace examples and hunt edge cases", sub: "Bug recovery separates solid answers from shaky ones.", body: "Prove the solution against concrete cases, talk through tricky inputs, and debug systematically instead of hoping." },
  { s: 37, e: 40, label: "Complexity", title: "Defend time and space complexity", sub: "Your analysis has to match the code you wrote.", body: "The interviewer pressures the analysis and checks whether tradeoffs match the actual implementation." },
  { s: 40, e: 43, label: "Follow-up", title: "Handle the harder variant", sub: "Better candidates get pushed deeper, not let off early.", body: "Strong rounds get stretched with a tighter constraint, a scaling twist, or a variant that forces you to generalize." },
  { s: 43, e: 45, label: "Wrap-up", title: "Close like a real technical screen", sub: "A realistic final impression, not a timeout.", body: "The interviewer closes the round the way a real screen ends, and your scorecard follows." },
];
const PHASE_MS = 4200;
const pad2 = (n: number) => String(n).padStart(2, "0");

/** 45-minute arc: segments sized by duration, autoplaying playhead, click to jump. */
export function PhaseTimeline() {
  const [phase, setPhase] = useState(0);
  const playhead = useRef<HTMLDivElement>(null);
  const start = useRef(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    start.current = performance.now();
    let raf = 0;
    let current = 0;
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      let el = ts - start.current;
      if (el > PHASE_MS && !reduced) {
        start.current = ts;
        el = 0;
        current = (current + 1) % PHASES.length;
        setPhase(current);
      }
      const p = PHASES[current];
      const k = reduced ? 0 : Math.min(1, el / PHASE_MS);
      if (playhead.current) playhead.current.style.left = `${((p.s + (p.e - p.s) * k) / 45) * 100}%`;
    };
    raf = requestAnimationFrame(loop);
    // Clicking a segment jumps the loop there.
    const jump = (e: Event) => {
      current = (e as CustomEvent<number>).detail;
      start.current = performance.now();
    };
    window.addEventListener("landing-phase", jump);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("landing-phase", jump);
    };
  }, []);

  const select = (i: number) => {
    setPhase(i);
    window.dispatchEvent(new CustomEvent("landing-phase", { detail: i }));
  };

  const p = PHASES[phase];
  return (
    <div>
      <div className="mb-3 flex justify-between font-mono text-[11px] text-brand-subtle">
        <span>00:00</span>
        <span>45:00</span>
      </div>
      <div className="relative flex h-11 gap-[3px]">
        {PHASES.map((sg, i) => (
          <button
            key={sg.label}
            title={sg.label}
            aria-label={`Phase ${i + 1}: ${sg.label}`}
            aria-pressed={i === phase}
            onClick={() => select(i)}
            style={{ flex: sg.e - sg.s }}
            className={cn(
              "min-w-0 overflow-hidden rounded font-mono text-[10px] transition-colors",
              i === phase
                ? "bg-brand-cyan/[0.16] text-brand-cyan shadow-[inset_0_0_0_1px_rgb(var(--brand-cyan))]"
                : "bg-white/5 text-brand-subtle hover:bg-white/10 hover:text-brand-text"
            )}
          >
            {pad2(i + 1)}
          </button>
        ))}
        <div
          ref={playhead}
          aria-hidden
          className="pointer-events-none absolute -bottom-2 -top-2 left-0 w-px bg-brand-text shadow-[0_0_12px_#EDEEF0]"
        />
      </div>
      <div className="mt-16 grid min-h-[220px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-12" aria-live="polite">
        <div>
          <div className="mb-5 font-mono text-[13px] text-brand-cyan">
            {pad2(p.s)}:00 to {pad2(p.e)}:00 · Phase {phase + 1} · {p.label}
          </div>
          <h3 className="text-balance text-[clamp(28px,3.2vw,44px)] font-normal leading-[1.08] tracking-[-0.03em]">{p.title}</h3>
        </div>
        <div className="pt-1">
          <p className="mb-5 text-[15px] leading-normal text-brand-text">{p.sub}</p>
          <p className="text-pretty text-[17px] leading-relaxed text-brand-muted">{p.body}</p>
        </div>
      </div>
    </div>
  );
}

type Dim = { name: string; short: string; score: number };

/** Radar + bar rows that grow in once the card scrolls into view. */
export function ScoreCard({
  dims,
  overall,
  interviewerName,
  header,
  footer,
}: {
  dims: Dim[];
  overall: number;
  interviewerName: string;
  header: React.ReactNode;
  footer: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  // Hovering a row or a radar axis highlights that dimension in both.
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setK(1);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 1400);
        setK(1 - (1 - p) ** 3);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.2 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const c = 160;
  const R = 120;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / dims.length;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
  };
  const poly = (r: (i: number) => number) => dims.map((_, i) => pt(i, r(i)).join(",")).join(" ");

  return (
    <div ref={ref} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-16">
      <div>
        {header}
        <div className="flex flex-col border-t border-white/[0.08]">
        {dims.map((d, i) => {
          const on = hover === i;
          return (
            <div
              key={d.name}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-4 border-b border-white/[0.08] py-3.5 transition-[padding,background-color] duration-300",
                on && "bg-white/[0.02] pl-2"
              )}
            >
              <span className={cn("text-[15px] transition-colors", on && "text-brand-cyan")}>{d.name}</span>
              <span className={cn("relative bg-white/[0.08] transition-[height] duration-300", on ? "h-1" : "h-0.5")}>
                <span className="absolute inset-y-0 left-0 bg-brand-cyan" style={{ width: `${d.score * k}%` }} />
              </span>
              <span className={cn("text-right font-mono text-[13px] transition-colors", on ? "text-brand-text" : "text-brand-muted")}>
                {Math.round(d.score * k)}
              </span>
            </div>
          );
        })}
        </div>
        {footer}
      </div>

      <div className="flex flex-col gap-3 rounded-[20px] border border-white/[0.09] bg-brand-surface p-7">
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">
          <span>Performance breakdown</span>
          <span>{interviewerName} · sample round</span>
        </div>
        <svg viewBox="-40 0 400 320" className="mx-auto block w-full max-w-[520px] overflow-visible" role="img" aria-label="Sample five-dimension score radar">
          {[0.25, 0.5, 0.75, 1].map((l) => (
            <polygon key={l} points={poly(() => R * l)} fill="none" stroke="rgba(255,255,255,0.09)" />
          ))}
          {dims.map((_, i) => {
            const [x, y] = pt(i, R);
            return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" />;
          })}
          <polygon points={poly((i) => (R * dims[i].score * k) / 100)} style={{ fill: ACCENT(0.14), stroke: ACCENT() }} strokeWidth={1.5} />
          {hover !== null ? (
            <line x1={c} y1={c} x2={pt(hover, R)[0]} y2={pt(hover, R)[1]} strokeDasharray="2 4" style={{ stroke: ACCENT(0.5) }} />
          ) : null}
          {dims.map((d, i) => {
            const [x, y] = pt(i, (R * d.score * k) / 100);
            const on = hover === i;
            return (
              <g key={d.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
                {on ? <circle cx={x} cy={y} r={10} style={{ fill: ACCENT(0.18) }} /> : null}
                <circle cx={x} cy={y} r={on ? 5 : 3.5} style={{ fill: ACCENT(), transition: "r 200ms" }} />
                {/* Generous invisible hit target around each vertex. */}
                <circle cx={x} cy={y} r={18} fill="transparent" />
              </g>
            );
          })}
          {dims.map((d, i) => {
            const [x, y] = pt(i, R + 22);
            return (
              <text
                key={d.name}
                x={x}
                y={y}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ fill: hover === i ? ACCENT() : "#8E939B", transition: "fill 200ms" }}
                dominantBaseline="middle"
                textAnchor={x < c - 5 ? "end" : x > c + 5 ? "start" : "middle"}
                className="font-mono text-[10px] tracking-[0.06em]"
              >
                {d.short}
                {hover === i ? <tspan fill="#E6E8EB"> {d.score}</tspan> : null}
              </text>
            );
          })}
        </svg>
        <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-subtle">Overall</span>
          <span className="text-[44px] font-light tracking-[-0.04em]">
            {Math.round(overall * k)}
            <span className="text-base text-brand-subtle">/100</span>
          </span>
        </div>
      </div>
    </div>
  );
}
