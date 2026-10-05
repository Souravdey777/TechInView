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
  "Dark theme is the product default. Do not introduce a light mode in V1 surfaces.",
  "Use cyan for primary action and focus. Reserve green, amber, and rose for semantic states.",
  "Marketing pages use one accent only (cyan), hairline borders, and mono uppercase eyebrows such as \"01 · Interview room\".",
  "Keep operational screens dense, scan-friendly, and restrained. Avoid marketing hero composition inside app tools.",
  "Use 8px radius for compact controls and 12-24px radius for major product panels.",
  "Pair icon buttons with accessible labels or visible text when the command is not obvious.",
  "Prefer existing shared components before adding a new primitive.",
] as const;

/** Marketing surfaces (landing page) re-skin the brand tokens via `.theme-landing` in globals.css. */
export const DESIGN_SYSTEM_LANDING_COLORS = [
  { name: "Ink", token: "--brand-deep", value: "#0A0B0D", usage: "Page background" },
  { name: "Panel", token: "--brand-surface", value: "#0E1013", usage: "Demo panels and cards" },
  { name: "Text", token: "--brand-text", value: "#EDEEF0", usage: "Headlines and primary copy" },
  { name: "Muted", token: "--brand-muted", value: "#8E939B", usage: "Body copy and nav links" },
  { name: "Subtle", token: "--brand-subtle", value: "#5B6068", usage: "Eyebrows, secondary headline half" },
  { name: "Cyan", token: "--brand-cyan", value: "#22D3EE", usage: "The only accent: CTAs, active links, timeline and score highlights" },
] as const;

export const DESIGN_SYSTEM_LOGO_RULES = [
  "The mark is code brackets holding the voice dot. Brackets take the text colour; the dot is always brand cyan #22D3EE (#0891B2 on white, where the lighter cyan is too faint).",
  "Use BrandLogo or BrandMark from src/components/shared/BrandLogo.tsx. Do not place the mark on a gradient tile or recolour the dot.",
  "The wordmark is lowercase \"techinview\". Write the company name as TechInView in sentences.",
  "Below 20px use the 16px cut (wider bracket arms on whole pixels); it ships in favicon.ico.",
  "Keep clear space of at least half the mark's width on every side.",
] as const;

export const DESIGN_SYSTEM_VOICE_STATES = [
  { state: "idle", label: "Ready", usage: "Smaller and slow. Nothing is happening yet." },
  { state: "listening", label: "Listening", usage: "Cyan and violet. The candidate is talking." },
  { state: "thinking", label: "Thinking", usage: "Amber. The interviewer is preparing a reply." },
  { state: "speaking", label: "Speaking", usage: "Green. The interviewer is talking. Marketing uses this state only." },
] as const;

export const DESIGN_SYSTEM_WRITING_RULES = [
  "No em dashes anywhere in user-facing copy. Use a comma, colon, period, or a middle dot (·) for compact labels.",
  "Say what happens in the product in concrete terms. Avoid hype words such as unlock, elevate, seamless, supercharge, or journey.",
  "Do not claim features that are not live. Java and C++ execution, System Design, and Machine Coding are not shipped yet.",
  "Button labels are short and literal: \"Start interview\", \"Buy 3 interviews\", not \"Get started on your journey\".",
] as const;
