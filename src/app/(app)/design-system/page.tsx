import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Info,
  Layers3,
  Mic2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  DESIGN_SYSTEM_COLORS,
  DESIGN_SYSTEM_RULES,
  DESIGN_SYSTEM_SURFACES,
  DESIGN_SYSTEM_TYPOGRAPHY,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Design System | TechInView",
  description: "Internal product design system for TechInView.",
};

const COMPONENT_EXAMPLES = [
  {
    name: "Primary Action",
    description: "High intent action used once per decision surface.",
    preview: (
      <Button>
        Start Interview
        <ArrowRight className="h-4 w-4" />
      </Button>
    ),
  },
  {
    name: "Secondary Action",
    description: "Companion action for neutral navigation or alternate setup paths.",
    preview: <Button variant="secondary">Preview Setup</Button>,
  },
  {
    name: "Status Badges",
    description: "Semantic chips for availability, difficulty, and state.",
    preview: (
      <div className="flex flex-wrap gap-2">
        <Badge>Live</Badge>
        <Badge variant="easy">Solved</Badge>
        <Badge variant="medium">Medium</Badge>
        <Badge variant="destructive">Needs Review</Badge>
      </div>
    ),
  },
  {
    name: "Inputs",
    description: "Use compact fields with clear labels and visible focus states.",
    preview: (
      <div className="w-full max-w-xs">
        <Input placeholder="github.com/yourname" aria-label="Profile URL example" />
      </div>
    ),
  },
] as const;

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-text">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
        {description}
      </p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 text-brand-text">
      <section className="rounded-3xl border border-brand-border bg-brand-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <BrandLogo size="lg" wordmarkClassName="text-2xl" />
            <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
              Product Design System
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
              A working reference for TechInView surfaces: brand tokens, typography,
              components, and usage rules for voice-first interview workflows.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[28rem]">
            {[
              { label: "Dark-first", icon: ShieldCheck },
              { label: "Voice-led", icon: Mic2 },
              { label: "Code-ready", icon: Code2 },
              { label: "Focused UI", icon: Layers3 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-brand-border bg-brand-surface p-4"
              >
                <item.icon className="h-4 w-4 text-brand-cyan" />
                <p className="mt-3 text-xs font-semibold text-brand-text">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Tokens"
          title="Color"
          description="Use brand tokens through Tailwind classes. Keep the interface quiet and let cyan carry primary action and active state."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {DESIGN_SYSTEM_COLORS.map((color) => (
            <div
              key={color.token}
              className="rounded-2xl border border-brand-border bg-brand-card p-4"
            >
              <div
                className={cn(
                  "h-16 rounded-xl border border-brand-border",
                  color.className
                )}
              />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-text">
                    {color.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-brand-muted">
                    {color.value}
                  </p>
                </div>
                <span className="rounded-md border border-brand-border bg-brand-surface px-2 py-1 font-mono text-[10px] text-brand-muted">
                  {color.token}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                {color.usage}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Type"
            title="Typography"
            description="Sora is used for product copy and headings; JetBrains Mono is reserved for code, tokens, and compact technical values."
          />
          <div className="rounded-3xl border border-brand-border bg-brand-card">
            {DESIGN_SYSTEM_TYPOGRAPHY.map((item, index) => (
              <div
                key={item.name}
                className={cn(
                  "grid gap-4 p-5 lg:grid-cols-[11rem_minmax(0,1fr)_14rem]",
                  index > 0 && "border-t border-brand-border"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-brand-text">
                    {item.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-brand-muted">
                    {item.className}
                  </p>
                </div>
                <p className={cn("text-brand-text", item.className)}>
                  {item.sample}
                </p>
                <p className="text-xs leading-relaxed text-brand-muted">
                  {item.usage}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <SectionHeader
            eyebrow="Rules"
            title="Usage"
            description="Small rules that keep product screens cohesive."
          />
          <div className="rounded-3xl border border-brand-border bg-brand-card p-5">
            <div className="space-y-4">
              {DESIGN_SYSTEM_RULES.map((rule) => (
                <div key={rule} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                  <p className="text-sm leading-relaxed text-brand-muted">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Surfaces"
          title="Layout Primitives"
          description="Use surface hierarchy to separate page, panel, inset content, and selected state without adding visual noise."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DESIGN_SYSTEM_SURFACES.map((surface) => (
            <div
              key={surface.name}
              className="rounded-2xl border border-brand-border bg-brand-card p-5"
            >
              <div className={cn("h-20 rounded-xl", surface.className)} />
              <p className="mt-4 text-sm font-semibold text-brand-text">
                {surface.name}
              </p>
              <p className="mt-2 font-mono text-xs text-brand-muted">
                {surface.className}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                {surface.usage}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Components"
          title="Core UI"
          description="These examples use the same primitives already shared across dashboards, setup flows, and interview screens."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {COMPONENT_EXAMPLES.map((example) => (
            <Card key={example.name}>
              <CardHeader>
                <CardTitle>{example.name}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-24 items-center rounded-2xl border border-brand-border bg-brand-surface p-4">
                  {example.preview}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-border bg-brand-card p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-brand-cyan">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">Interview Feedback Pattern</p>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-brand-text">
              Score panels should show a value, context, and next action.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Keep result surfaces structured around evaluation signal. Use muted copy for
              context, badges for state, and cyan only where the user can act.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-brand-text">Technical Depth</p>
              <Badge variant="default">82</Badge>
            </div>
            <Progress value={82} className="mt-4" />
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-border bg-brand-card p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
              <p className="text-xs leading-relaxed text-brand-muted">
                Strong framework reasoning. Add more concrete production examples
                when discussing tradeoffs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
