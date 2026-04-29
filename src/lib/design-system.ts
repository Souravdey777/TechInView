export const DESIGN_SYSTEM_COLOR_VALUES = {
  deep: "#07080a",
  surface: "#0d1017",
  card: "#111820",
  border: "#1a2332",
  text: "#e2e8f0",
  muted: "#7a8ba3",
  subtle: "#4a5568",
  cyan: "#22d3ee",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#f472b6",
} as const;

export const DESIGN_SYSTEM_CHART_COLORS = {
  background: DESIGN_SYSTEM_COLOR_VALUES.deep,
  grid: DESIGN_SYSTEM_COLOR_VALUES.border,
  axis: DESIGN_SYSTEM_COLOR_VALUES.border,
  tick: DESIGN_SYSTEM_COLOR_VALUES.subtle,
  label: DESIGN_SYSTEM_COLOR_VALUES.muted,
  score: DESIGN_SYSTEM_COLOR_VALUES.cyan,
  success: DESIGN_SYSTEM_COLOR_VALUES.green,
  warning: DESIGN_SYSTEM_COLOR_VALUES.amber,
  danger: DESIGN_SYSTEM_COLOR_VALUES.rose,
} as const;

export function getDesignSystemScoreColor(score: number) {
  if (score >= 85) return DESIGN_SYSTEM_CHART_COLORS.success;
  if (score >= 70) return DESIGN_SYSTEM_CHART_COLORS.score;
  if (score >= 55) return DESIGN_SYSTEM_CHART_COLORS.warning;
  return DESIGN_SYSTEM_CHART_COLORS.danger;
}

export const DESIGN_SYSTEM_COLORS = [
  {
    name: "Deep",
    token: "brand.deep",
    value: DESIGN_SYSTEM_COLOR_VALUES.deep,
    usage: "App background and full-screen shells",
    className: "bg-brand-deep",
  },
  {
    name: "Surface",
    token: "brand.surface",
    value: DESIGN_SYSTEM_COLOR_VALUES.surface,
    usage: "Navigation, panels, and input backgrounds",
    className: "bg-brand-surface",
  },
  {
    name: "Card",
    token: "brand.card",
    value: DESIGN_SYSTEM_COLOR_VALUES.card,
    usage: "Primary content containers",
    className: "bg-brand-card",
  },
  {
    name: "Border",
    token: "brand.border",
    value: DESIGN_SYSTEM_COLOR_VALUES.border,
    usage: "Separators and component outlines",
    className: "bg-brand-border",
  },
  {
    name: "Text",
    token: "brand.text",
    value: DESIGN_SYSTEM_COLOR_VALUES.text,
    usage: "Primary copy and headings",
    className: "bg-brand-text",
  },
  {
    name: "Muted",
    token: "brand.muted",
    value: DESIGN_SYSTEM_COLOR_VALUES.muted,
    usage: "Secondary copy and metadata",
    className: "bg-brand-muted",
  },
  {
    name: "Cyan",
    token: "brand.cyan",
    value: DESIGN_SYSTEM_COLOR_VALUES.cyan,
    usage: "Primary actions, focus, and active states",
    className: "bg-brand-cyan",
  },
  {
    name: "Green",
    token: "brand.green",
    value: DESIGN_SYSTEM_COLOR_VALUES.green,
    usage: "Success, solved states, and positive deltas",
    className: "bg-brand-green",
  },
  {
    name: "Amber",
    token: "brand.amber",
    value: DESIGN_SYSTEM_COLOR_VALUES.amber,
    usage: "Warnings, medium difficulty, and paused states",
    className: "bg-brand-amber",
  },
  {
    name: "Rose",
    token: "brand.rose",
    value: DESIGN_SYSTEM_COLOR_VALUES.rose,
    usage: "Errors, hard difficulty, and destructive actions",
    className: "bg-brand-rose",
  },
] as const;

export const DESIGN_SYSTEM_TYPOGRAPHY = [
  {
    name: "Display",
    className: "text-4xl font-bold tracking-tight",
    sample: "Voice-first interview practice",
    usage: "Page-level marketing and major product moments",
  },
  {
    name: "Page title",
    className: "text-2xl font-bold tracking-tight",
    sample: "Technical Q&A Setup",
    usage: "Authenticated app pages",
  },
  {
    name: "Section title",
    className: "text-xl font-semibold",
    sample: "Practice Now",
    usage: "Dashboard sections and setup groups",
  },
  {
    name: "Card title",
    className: "text-lg font-semibold",
    sample: "AI Interview Mode",
    usage: "Repeated cards and compact panels",
  },
  {
    name: "Body",
    className: "text-sm leading-relaxed",
    sample: "Answer one focused prompt at a time while Tia probes for tradeoffs.",
    usage: "Primary explanatory copy",
  },
  {
    name: "Caption",
    className: "text-xs",
    sample: "45 min · Voice chat",
    usage: "Metadata, hints, and helper text",
  },
] as const;

export const DESIGN_SYSTEM_SURFACES = [
  {
    name: "Page Shell",
    className: "bg-brand-deep",
    usage: "Use once per page as the full-screen base.",
  },
  {
    name: "Panel",
    className: "border border-brand-border bg-brand-card",
    usage: "Use for main sections that group related controls.",
  },
  {
    name: "Inset Surface",
    className: "border border-brand-border bg-brand-surface",
    usage: "Use inside panels for grouped choices or secondary content.",
  },
  {
    name: "Selected State",
    className: "border border-brand-cyan bg-brand-cyan/10",
    usage: "Use for selected options, active tabs, and current filters.",
  },
] as const;

export const DESIGN_SYSTEM_RULES = [
  "Dark theme is the product default; do not introduce a light mode in V1 surfaces.",
  "Use cyan for primary action and focus. Reserve green, amber, and rose for semantic states.",
  "Keep operational screens dense, scan-friendly, and restrained. Avoid marketing hero composition inside app tools.",
  "Use 8px radius for compact controls and 12-24px radius for major product panels.",
  "Pair icon buttons with accessible labels or visible text when the command is not obvious.",
  "Prefer existing shared components before adding a new primitive.",
] as const;
