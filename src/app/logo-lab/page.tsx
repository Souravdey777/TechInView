/* eslint-disable @next/next/no-img-element -- raw SVGs at exact pixel sizes */
import { notFound } from "next/navigation";

const DIR = "/brand/concepts";
const SIZES = [16, 24, 32, 48, 128];

type Entry = {
  key: string;
  name: string;
  markDark: string;
  markLight: string;
  favDark?: string;
  favLight?: string;
  monoDark?: string;
  monoLight?: string;
  icon: string;
  lockupDark?: string;
  lockupLight?: string;
  rationale: string[];
};

const concept = (k: string, name: string, rationale: string[]): Entry => ({
  key: k.toUpperCase(),
  name,
  markDark: `${DIR}/concept-${k}-mark-accent-on-dark.svg`,
  markLight: `${DIR}/concept-${k}-mark-accent-on-light.svg`,
  favDark: `${DIR}/concept-${k}-favicon-on-dark.svg`,
  favLight: `${DIR}/concept-${k}-favicon-on-light.svg`,
  monoDark: `${DIR}/concept-${k}-mark-mono-on-dark.svg`,
  monoLight: `${DIR}/concept-${k}-mark-mono-on-light.svg`,
  icon: `${DIR}/concept-${k}-icon.svg`,
  lockupDark: `${DIR}/concept-${k}-lockup-on-dark.svg`,
  lockupLight: `${DIR}/concept-${k}-lockup-on-light.svg`,
  rationale,
});

const CURRENT: Entry = {
  key: "Now",
  name: "Current mark",
  markDark: "/images/techinview-mark.svg",
  markLight: "/images/techinview-mark.svg",
  icon: "/images/techinview-logo.png",
  rationale: [],
};

const CONCEPTS: Entry[] = [
  concept("a", "Bracket wave", [
    "The direct descendant. Same idea as today (code brackets holding three voice bars) with the rounded gradient strokes replaced by square-cut solid geometry on a 32 unit grid. One stroke weight throughout: 3 units in the master, 4 units in the 16px cut.",
    "Ink brackets, cyan bars: the only colour is the voice, which is how the landing page uses cyan.",
    "Cost: five strokes and four gaps across 16 pixels do not fit at 2px each, so even the 16px cut has 1.5px gaps and the bars read as texture rather than three bars. It holds up from 24px. Keeps the most equity, carries the most detail.",
  ]),
  concept("b", "Prompt", [
    "Reframes the metaphor as a terminal prompt followed by a rising voice level: you type the command, the interviewer answers. The chevron is the code half, the two bars are the voice half.",
    "Asymmetric and directional, so it reads as an action rather than a container. Bars sit on even coordinates and stay crisp at 16px; the chevron is a single diagonal stroke and anti-aliases cleanly.",
    "Cost: drops the brackets, which are the most recognisable part of the current mark, and a prompt chevron is a common developer tools motif.",
  ]),
  concept("c", "Bracketed dot", [
    "Keeps the brackets and replaces the three bars with one cyan dot. The dot is the voice orb from the hero and the dot already sitting before the wordmark in the new nav, so the mark and the page say the same thing. It also reads as a live or recording indicator, which is what a mock interview is.",
    "Three shapes only. In the 16px cut the brackets are 2px strokes with 2px of air on each side of a 4.5px dot, all on whole pixels. Strongest of the three at favicon size and the easiest to animate later (the dot can pulse with the agent state).",
    "Cost: less literal about voice than bars, and simple bracket marks exist elsewhere, so the cyan dot and the exact proportions have to do the identifying.",
  ]),
];

function Swatch({ bg, children }: { bg: "dark" | "light"; children: React.ReactNode }) {
  return (
    <div
      className={
        bg === "dark"
          ? "flex flex-wrap items-end gap-6 rounded-lg border border-white/[0.08] bg-[#0A0B0D] px-6 py-5"
          : "flex flex-wrap items-end gap-6 rounded-lg border border-black/[0.08] bg-white px-6 py-5"
      }
    >
      {children}
    </div>
  );
}

function Ramp({ src, fav, bg }: { src: string; fav?: string; bg: "dark" | "light" }) {
  return (
    <Swatch bg={bg}>
      {fav && (
        <div className="flex flex-col items-center gap-2">
          <img src={fav} width={16} height={16} alt="" />
          <span className="font-mono text-[10px] text-[#22D3EE]">16 cut</span>
        </div>
      )}
      {SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <img src={src} width={s} height={s} alt="" />
          <span className={bg === "dark" ? "font-mono text-[10px] text-[#5B6068]" : "font-mono text-[10px] text-[#8E939B]"}>
            {s}
          </span>
        </div>
      ))}
    </Swatch>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8E939B]">{children}</p>;
}

function NavMock({ entry, bg }: { entry: Entry; bg: "dark" | "light" }) {
  const dark = bg === "dark";
  return (
    <div
      className={
        dark
          ? "flex h-16 items-center justify-between gap-6 rounded-lg border border-white/[0.08] bg-[#0A0B0D] px-6"
          : "flex h-16 items-center justify-between gap-6 rounded-lg border border-black/[0.08] bg-white px-6"
      }
    >
      <span className="flex items-center gap-2.5">
        <img src={dark ? entry.markDark : entry.markLight} width={20} height={20} alt="" />
        <span
          className={
            dark
              ? "text-[17px] font-medium tracking-[-0.02em] text-[#EDEEF0]"
              : "text-[17px] font-medium tracking-[-0.02em] text-[#0A0B0D]"
          }
        >
          techinview
        </span>
      </span>
      <span className="hidden gap-8 font-mono text-xs uppercase tracking-[0.08em] text-[#8E939B] lg:flex">
        <span>Features</span>
        <span>How it works</span>
        <span>Pricing</span>
      </span>
      <span className="flex items-center gap-5">
        <span className="hidden text-sm text-[#8E939B] sm:inline">Log in</span>
        <span className="rounded-full bg-[#22D3EE] px-4 py-[9px] text-sm font-medium text-[#0A0B0D]">Start free</span>
      </span>
    </div>
  );
}

export default function LogoLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const all = [CURRENT, ...CONCEPTS];

  return (
    <div
      className="theme-landing min-h-screen bg-[#0A0B0D] px-5 py-14 font-sans text-[#EDEEF0] antialiased sm:px-12"
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      />

      <div className="mx-auto max-w-[1320px] space-y-16">
        <header className="space-y-3">
          <Label>Logo lab / dev only</Label>
          <h1 className="text-4xl font-medium tracking-[-0.03em]">Mark concepts for the new direction</h1>
          <p className="max-w-2xl text-[#8E939B]">
            Current mark against three redraws. Masters are drawn on a 32 unit grid with a 3 unit stroke on
            integer coordinates, so they land on whole pixels at 32 and above. Each concept also has a 16px cut
            with a 4 unit stroke (exactly 2px), shown first in each ramp and meant for the favicon. Files live in <code className="font-mono text-sm">public/brand/concepts</code>.
          </p>
        </header>

        <section className="space-y-6">
          <Label>01 / Size ramp, 16 24 32 48 128</Label>
          {all.map((e) => (
            <div key={e.key} className="grid gap-3 border-t border-white/[0.08] pt-5 xl:grid-cols-[180px_1fr_1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#22D3EE]">{e.key}</p>
                <p className="text-lg font-medium tracking-[-0.02em]">{e.name}</p>
              </div>
              <Ramp src={e.markDark} fav={e.favDark} bg="dark" />
              <Ramp src={e.markLight} fav={e.favLight} bg="light" />
              {e.monoDark && e.monoLight && (
                <>
                  <p className="self-center font-mono text-[11px] uppercase tracking-[0.08em] text-[#5B6068]">Single colour</p>
                  <Ramp src={e.monoDark} bg="dark" />
                  <Ramp src={e.monoLight} bg="light" />
                </>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <Label>02 / App icon</Label>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {all.map((e) => (
              <div key={e.key} className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#8E939B]">
                  {e.key} / {e.name}
                </p>
                <Swatch bg="dark">
                  {[32, 64, 128].map((s) => (
                    <img key={s} src={e.icon} width={s} height={s} alt="" />
                  ))}
                </Swatch>
                <Swatch bg="light">
                  {[32, 64, 128].map((s) => (
                    <img key={s} src={e.icon} width={s} height={s} alt="" />
                  ))}
                </Swatch>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <Label>03 / Lockups in the nav</Label>
          <p className="max-w-2xl text-sm text-[#8E939B]">
            Live nav: mark at 20px plus the wordmark as Geist 500 live text, the way the site renders it. Below each,
            the standalone SVG lockup at nav height, with the wordmark drawn as monoline paths (no font dependency).
          </p>
          {CONCEPTS.map((e) => (
            <div key={e.key} className="space-y-3 border-t border-white/[0.08] pt-5">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#22D3EE]">
                {e.key} / {e.name}
              </p>
              <div className="grid gap-3 xl:grid-cols-2">
                <NavMock entry={e} bg="dark" />
                <NavMock entry={e} bg="light" />
                <Swatch bg="dark">
                  <img src={e.lockupDark} height={24} style={{ height: 24, width: "auto" }} alt="" />
                  <img src={e.lockupDark} height={48} style={{ height: 48, width: "auto" }} alt="" />
                </Swatch>
                <Swatch bg="light">
                  <img src={e.lockupLight} height={24} style={{ height: 24, width: "auto" }} alt="" />
                  <img src={e.lockupLight} height={48} style={{ height: 48, width: "auto" }} alt="" />
                </Swatch>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <Label>04 / Rationale</Label>
          <div className="grid gap-4 lg:grid-cols-3">
            {CONCEPTS.map((e) => (
              <article key={e.key} className="space-y-4 rounded-lg border border-white/[0.08] p-6">
                <div className="flex items-center gap-3">
                  <img src={e.markDark} width={32} height={32} alt="" />
                  <h2 className="text-lg font-medium tracking-[-0.02em]">
                    {e.key} / {e.name}
                  </h2>
                </div>
                {e.rationale.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-[#8E939B]">
                    {p}
                  </p>
                ))}
              </article>
            ))}
          </div>
          <div className="rounded-lg border border-[#22D3EE]/40 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#22D3EE]">Recommendation / C, Bracketed dot</p>
            <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-[#B8BCC2]">
              <p>
                C is the only concept that is fully legible at 16px and it ties the mark to things the new site already
                does: the cyan dot in the nav and the voice orb in the hero. The brackets carry the equity from the
                current mark, so existing users still see the same shape language.
              </p>
              <p>
                It uses cyan once, on the one element that means voice, which matches the one accent rule. Rolling it
                out also simplifies the nav: the dot before the wordmark becomes the mark itself.
              </p>
              <p>
                Keep A as the fallback if the three bars are considered essential. Skip B; it trades away the brackets
                for a motif many developer tools already use.
              </p>
              <p>
                Wordmark: lowercase techinview, medium weight, tight tracking, matching the nav. Lowercase keeps the
                word one shape and avoids the TechInView versus Techinview casing split that exists today.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
