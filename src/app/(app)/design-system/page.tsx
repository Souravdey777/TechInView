import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { ArrowRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BrandLogo, BrandMark } from "@/components/shared/BrandLogo";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import {
  DESIGN_SYSTEM_COLORS,
  DESIGN_SYSTEM_LANDING_COLORS,
  DESIGN_SYSTEM_LOGO_RULES,
  DESIGN_SYSTEM_RULES,
  DESIGN_SYSTEM_SURFACES,
  DESIGN_SYSTEM_TYPOGRAPHY,
  DESIGN_SYSTEM_VOICE_STATES,
  DESIGN_SYSTEM_WRITING_RULES,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Design System | TechInView",
  description: "Internal product design system for TechInView.",
};

/*
 * The page chrome uses the landing look (ink, cool greys, one cyan accent,
 * Geist), which the root layout now applies to every route via .theme-landing
 * on <body>. Specimens restore the base :root tokens only where they document them.
 */
const LANDING_VARS = {
  "--brand-deep": "10 11 13",
  "--brand-surface": "14 16 19",
  "--brand-card": "16 18 21",
  "--brand-border": "30 31 34",
  "--brand-text": "237 238 240",
  "--brand-muted": "142 147 155",
  "--brand-subtle": "91 96 104",
} as CSSProperties;

/** Product tokens (globals.css :root), restored inside specimens so they show the real app. */
const PRODUCT_VARS = {
  "--brand-deep": "7 8 10",
  "--brand-surface": "13 16 23",
  "--brand-card": "17 24 32",
  "--brand-border": "26 35 50",
  "--brand-text": "226 232 240",
  "--brand-muted": "122 139 163",
  "--brand-subtle": "74 85 104",
} as CSSProperties;

const SANS = "font-[Geist,system-ui,sans-serif]";
const MONO = "font-['Geist_Mono',ui-monospace,monospace]";
const H2 = "text-balance text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.05] tracking-[-0.035em]";
const LABEL = `${MONO} text-[11px] uppercase tracking-[0.12em] text-brand-subtle`;

function Section({
  n,
  eyebrow,
  title,
  description,
  children,
}: {
  n: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.08] py-16">
      <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <div className={`mb-4 ${MONO} text-xs uppercase tracking-[0.14em] text-brand-subtle`}>
            {n} · {eyebrow}
          </div>
          <h2 className={H2}>{title}</h2>
        </div>
        <p className="max-w-[480px] text-[15px] leading-relaxed text-brand-muted lg:justify-self-end">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** A framed specimen rendered with product tokens and fonts. */
function Specimen({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div style={PRODUCT_VARS} className={cn("font-sans", className)}>
      {children}
    </div>
  );
}

function RuleList({ rules }: { rules: readonly string[] }) {
  return (
    <ol className="border-t border-white/[0.08]">
      {rules.map((rule, i) => (
        <li key={rule} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-b border-white/[0.08] py-4">
          <span className={`${MONO} text-xs text-brand-cyan`}>/{String(i + 1).padStart(2, "0")}</span>
          <span className="text-[15px] leading-relaxed text-brand-muted">{rule}</span>
        </li>
      ))}
    </ol>
  );
}

const COMPONENT_EXAMPLES = [
  {
    name: "Primary action",
    description: "High intent action, used once per decision surface.",
    preview: (
      <Button>
        Start interview
        <ArrowRight className="h-4 w-4" />
      </Button>
    ),
  },
  {
    name: "Secondary action",
    description: "Companion action for neutral navigation or an alternate setup path.",
    preview: <Button variant="secondary">Preview setup</Button>,
  },
  {
    name: "Status badges",
    description: "Semantic chips for availability, difficulty, and state.",
    preview: (
      <div className="flex flex-wrap gap-2">
        <Badge>Live</Badge>
        <Badge variant="easy">Solved</Badge>
        <Badge variant="medium">Medium</Badge>
        <Badge variant="destructive">Needs review</Badge>
      </div>
    ),
  },
  {
    name: "Inputs",
    description: "Compact fields with clear labels and visible focus states.",
    preview: (
      <div className="w-full max-w-xs">
        <Input placeholder="github.com/yourname" aria-label="Profile URL example" />
      </div>
    ),
  },
] as const;

export default function DesignSystemPage() {
  return (
    <div style={LANDING_VARS} className={cn(SANS, "mx-auto max-w-[1200px] bg-brand-deep text-brand-text antialiased")}>

      <header className="pb-16 pt-6">
        <div className={`mb-8 ${MONO} text-xs uppercase tracking-[0.14em] text-brand-cyan`}>[ Design system ]</div>
        <h1 className="max-w-[14ch] text-balance text-[clamp(40px,6vw,80px)] font-normal leading-[0.98] tracking-[-0.045em]">
          How TechInView looks<span className="text-brand-subtle">, and why.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[520px] text-[17px] leading-relaxed text-brand-muted">
            The reference for every surface: logo, voice orb, colour tokens, typography, components, and the
            rules for writing copy. Marketing and product share all of it: one palette, one type family, one
            accent.
          </p>
          <div className={`flex flex-wrap gap-x-8 gap-y-2 ${MONO} text-xs uppercase tracking-[0.08em] text-brand-muted`}>
            <span>Dark-first</span>
            <span>Voice-led</span>
            <span>Code-ready</span>
            <span>One accent</span>
          </div>
        </div>
      </header>

      <Section
        n="01"
        eyebrow="Logo"
        title="Brackets holding the voice dot."
        description="The brackets are the code editor, the dot is the interviewer listening. Concepts and size tests live at /logo-lab in development."
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-3 border-l border-t border-white/[0.08]">
            <div className="col-span-3 flex min-h-[180px] flex-col justify-between border-b border-r border-white/[0.08] p-6">
              <span className={LABEL}>Lockup</span>
              <div className="self-center">
                <BrandLogo size="lg" />
              </div>
            </div>
            {[
              { label: "Mark", node: <BrandMark className="h-12 w-12" /> },
              {
                label: "App icon",
                // eslint-disable-next-line @next/next/no-img-element
                node: <img src="/icon.png" alt="" width={56} height={56} className="rounded-xl" />,
              },
              {
                label: "On light",
                node: (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
                    <BrandMark className="h-9 w-9 text-[#0A0B0D] [&_circle]:fill-[#0891B2]" />
                  </span>
                ),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex min-h-[160px] flex-col justify-between border-b border-r border-white/[0.08] p-6"
              >
                <span className={LABEL}>{item.label}</span>
                <div className="self-center">{item.node}</div>
              </div>
            ))}
          </div>
          <RuleList rules={DESIGN_SYSTEM_LOGO_RULES} />
        </div>
      </Section>

      <Section
        n="02"
        eyebrow="Voice"
        title="One orb, four states."
        description="VoiceVisualizer is the only voice indicator. States crossfade over 700ms and idle shrinks to 75%. Use it in interview rooms and on the landing page, never as decoration."
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border-l border-t border-white/[0.08]">
          {DESIGN_SYSTEM_VOICE_STATES.map((v, i) => (
            <div key={v.state} className="flex flex-col gap-6 border-b border-r border-white/[0.08] p-6">
              <div className="flex justify-between">
                <span className={LABEL}>/{String(i + 1).padStart(2, "0")}</span>
                <span className={`${MONO} text-[11px] text-brand-muted`}>state=&quot;{v.state}&quot;</span>
              </div>
              <div className="flex h-36 items-center justify-center">
                <VoiceVisualizer state={v.state} className="h-28 w-28" />
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-[-0.02em]">{v.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{v.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        n="03"
        eyebrow="Colour"
        title="One palette, one accent."
        description="The root layout puts .theme-landing on <body>, so every page, dialog and toast uses the landing values. The :root brand-* values are the base it overrides."
      >
        <div className="space-y-12">
          <div>
            <div className={`mb-4 ${LABEL}`}>Base · :root brand-* tokens</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] border-l border-t border-white/[0.08]">
              {DESIGN_SYSTEM_COLORS.map((color) => (
                <div key={color.token} className="border-b border-r border-white/[0.08] p-5">
                  <div className="h-14 rounded-md border border-white/10" style={{ background: color.value }} />
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-medium">{color.name}</span>
                    <span className={`${MONO} text-xs text-brand-muted`}>{color.value}</span>
                  </div>
                  <p className={`mt-1 ${MONO} text-[11px] text-brand-subtle`}>{color.token}</p>
                  <p className="mt-3 text-sm leading-relaxed text-brand-muted">{color.usage}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-4 ${LABEL}`}>Applied · .theme-landing on body</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] border-l border-t border-white/[0.08]">
              {DESIGN_SYSTEM_LANDING_COLORS.map((c) => (
                <div key={c.name} className="border-b border-r border-white/[0.08] p-5">
                  <div className="h-14 rounded-md border border-white/10" style={{ background: c.value }} />
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-medium">{c.name}</span>
                    <span className={`${MONO} text-xs text-brand-muted`}>{c.value}</span>
                  </div>
                  <p className={`mt-1 ${MONO} text-[11px] text-brand-subtle`}>{c.token}</p>
                  <p className="mt-3 text-sm leading-relaxed text-brand-muted">{c.usage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        n="04"
        eyebrow="Type"
        title="Geist everywhere."
        description="Geist sets every surface, product and marketing. Geist Mono sets code, tokens, labels and compact technical values. Both load once from the root layout."
      >
        <div className="border-t border-white/[0.08]">
          {DESIGN_SYSTEM_TYPOGRAPHY.map((item) => (
            <div
              key={item.name}
              className="grid gap-4 border-b border-white/[0.08] py-6 lg:grid-cols-[12rem_minmax(0,1fr)_16rem] lg:items-baseline"
            >
              <div>
                <p className="text-[15px] font-medium">{item.name}</p>
                <p className={`mt-1 ${MONO} text-[11px] text-brand-subtle`}>{item.className}</p>
              </div>
              <Specimen>
                <p className={cn("text-brand-text", item.className)}>{item.sample}</p>
              </Specimen>
              <p className="text-sm leading-relaxed text-brand-muted">{item.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        n="05"
        eyebrow="Surfaces"
        title="Hierarchy without noise."
        description="Page, panel, inset and selected state. Each specimen renders with the product tokens it documents."
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border-l border-t border-white/[0.08]">
          {DESIGN_SYSTEM_SURFACES.map((surface) => (
            <div key={surface.name} className="border-b border-r border-white/[0.08] p-5">
              <Specimen>
                <div className={cn("h-24 rounded-xl", surface.className)} />
              </Specimen>
              <p className="mt-4 text-[15px] font-medium">{surface.name}</p>
              <p className={`mt-1 ${MONO} text-[11px] text-brand-subtle`}>{surface.className}</p>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">{surface.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        n="06"
        eyebrow="Components"
        title="Shared primitives, shown as they ship."
        description="The same Button, Badge, Input and Progress used across dashboards, setup flows and interview rooms."
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] border-l border-t border-white/[0.08]">
          {COMPONENT_EXAMPLES.map((example) => (
            <div key={example.name} className="border-b border-r border-white/[0.08] p-6">
              <h3 className="text-xl font-medium tracking-[-0.02em]">{example.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{example.description}</p>
              <Specimen className="mt-6 flex min-h-24 items-center rounded-xl bg-brand-surface p-5">
                {example.preview}
              </Specimen>
            </div>
          ))}
          <div className="border-b border-r border-white/[0.08] p-6 [grid-column:1/-1]">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <div>
                <span className={LABEL}>Pattern · interview feedback</span>
                <h3 className="mt-4 text-2xl font-normal tracking-[-0.03em]">
                  Score panels show a value, its context, and the next action.
                </h3>
                <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-brand-muted">
                  Keep result surfaces organised around the evaluation signal. Muted copy for context, badges for
                  state, cyan only where the user can act.
                </p>
              </div>
              <Specimen className="rounded-xl border border-brand-border bg-brand-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-text">Technical depth</p>
                  <Badge variant="default">82</Badge>
                </div>
                <Progress value={82} className="mt-4" />
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-border bg-brand-card p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  <p className="text-xs leading-relaxed text-brand-muted">
                    Strong framework reasoning. Add concrete production examples when you discuss tradeoffs.
                  </p>
                </div>
              </Specimen>
            </div>
          </div>
        </div>
      </Section>

      <Section
        n="07"
        eyebrow="Rules"
        title="Layout and writing."
        description="Small rules that keep every screen and every sentence consistent."
      >
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className={`mb-4 ${LABEL}`}>Layout and colour</div>
            <RuleList rules={DESIGN_SYSTEM_RULES} />
          </div>
          <div>
            <div className={`mb-4 ${LABEL}`}>Writing</div>
            <RuleList rules={DESIGN_SYSTEM_WRITING_RULES} />
          </div>
        </div>
      </Section>
    </div>
  );
}
