import {
  type PracticeInterviewKind,
  type PrepPlanSummary,
  type PrepPlanTrack,
} from "@/lib/dashboard/models";

type PrepPlanInput = {
  company: string;
  role: string;
  jdText: string;
};

const JD_SIGNAL_KEYWORDS: Record<string, string[]> = {
  backend: ["backend", "api", "service", "distributed", "scalable", "latency"],
  frontend: ["frontend", "react", "ui", "web", "design system"],
  leadership: ["lead", "mentor", "ownership", "cross-functional", "stakeholder"],
  architecture: ["architecture", "design", "reliability", "throughput", "microservices"],
  product: ["product", "customer", "roadmap", "prioritize"],
  fullstack: ["full stack", "fullstack", "frontend", "backend"],
  mobile: ["ios", "android", "mobile"],
  data: ["sql", "spark", "warehouse", "analytics", "data modeling"],
};

const DEFAULT_TRACK_ORDER: PracticeInterviewKind[] = [
  "dsa",
  "technical_qa",
  "machine_coding",
  "system_design",
  "behavioral",
  "engineering_manager",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractSignals(role: string, jdText: string) {
  const haystack = `${role}\n${jdText}`.toLowerCase();
  return Object.entries(JD_SIGNAL_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([signal]) => signal);
}

function isSeniorOrAbove(role: string) {
  const normalized = role.toLowerCase();
  return ["senior", "staff", "principal", "lead", "l5", "l6", "manager"].some((token) =>
    normalized.includes(token)
  );
}

function inferRelevantKinds(role: string, signals: string[]): PracticeInterviewKind[] {
  const relevant = new Set<PracticeInterviewKind>(["dsa"]);

  if (signals.includes("frontend") || signals.includes("fullstack") || signals.includes("mobile")) {
    relevant.add("machine_coding");
    relevant.add("technical_qa");
  }

  if (signals.includes("backend") || signals.includes("architecture") || signals.includes("data")) {
    relevant.add("technical_qa");
  }

  if (signals.includes("architecture") || signals.includes("backend") || isSeniorOrAbove(role)) {
    relevant.add("system_design");
  }

  if (signals.includes("leadership") || signals.includes("product") || isSeniorOrAbove(role)) {
    relevant.add("behavioral");
    relevant.add("engineering_manager");
  }

  if (relevant.size === 1) {
    relevant.add("technical_qa");
    relevant.add("behavioral");
  }

  return DEFAULT_TRACK_ORDER.filter((kind) => relevant.has(kind));
}

function nextActionForKind(kind: PracticeInterviewKind) {
  return {
    dsa: "Practice a coding screen that mirrors the likely phone screen bar",
    machine_coding: "Rehearse a scoped build round with the target stack",
    system_design: "Practice one architecture round with tradeoffs and scaling pressure",
    technical_qa: "Warm up on stack-specific depth questions before live rounds",
    engineering_manager: "Practice resume-grounded leadership and execution questions",
    behavioral: "Rehearse high-signal impact, conflict, and ownership stories",
  }[kind];
}

function likelyQuestionsForKind(kind: PracticeInterviewKind, company: string, role: string) {
  return {
    dsa: [
      `Solve a medium data-structures problem at the pace expected in a ${company} coding screen.`,
      "Explain the brute-force approach, optimize it, and defend the time and space complexity.",
      "Test the solution against empty input, duplicates, and the largest allowed input.",
    ],
    machine_coding: [
      `Build a scoped, production-minded feature relevant to a ${role} role.`,
      "Explain the component or domain model before implementation.",
      "Add validation, error handling, and tests for the highest-risk behavior.",
    ],
    system_design: [
      `Design a high-scale service relevant to ${company}'s product domain.`,
      "Estimate traffic and storage, then identify the first scaling bottleneck.",
      "Compare two architecture options and explain the reliability tradeoffs.",
    ],
    technical_qa: [
      `Explain a difficult technical decision you would expect a ${role} to own.`,
      "Diagnose a performance or reliability regression from limited evidence.",
      "Compare the main framework or platform alternatives named in the role.",
    ],
    engineering_manager: [
      "Describe how you aligned stakeholders around a technically difficult decision.",
      "Explain a project that slipped and what you changed in response.",
      "How do you balance delivery pressure, technical debt, and team health?",
    ],
    behavioral: [
      "Tell me about a high-impact decision you made with incomplete information.",
      "Describe a conflict with a teammate or stakeholder and how you resolved it.",
      "Give an example of feedback that materially changed how you work.",
    ],
  }[kind];
}

function titleForKind(kind: PracticeInterviewKind, role: string, signals: string[]) {
  switch (kind) {
    case "dsa":
      return signals.includes("backend") || signals.includes("architecture")
        ? "Coding Screen"
        : `${role} Coding Round`;
    case "machine_coding":
      return signals.includes("frontend")
        ? "Frontend or Product Build Round"
        : "Machine Coding or LLD Round";
    case "system_design":
      return "System Design Round";
    case "technical_qa":
      return "Technical Deep Dive";
    case "engineering_manager":
      return "Hiring Manager / Leadership Round";
    case "behavioral":
      return "Collaboration and Behavioral Round";
  }
}

function rationaleForKind(kind: PracticeInterviewKind, signals: string[], role: string) {
  switch (kind) {
    case "dsa":
      return "Most software roles still use a coding screen to set the baseline bar for problem solving and code quality.";
    case "machine_coding":
      return signals.includes("frontend") || signals.includes("fullstack")
        ? "The role signals hands-on product execution, so a scoped build round is likely to matter."
        : "Low-level design and implementation detail often show up as a practical coding round.";
    case "system_design":
      return isSeniorOrAbove(role)
        ? "Senior loops usually include a design round to evaluate tradeoffs, scope, and system judgment."
        : "The JD emphasizes architecture and scalability, so a design round is worth preparing for.";
    case "technical_qa":
      return "Company loops often include stack-specific probing beyond pure coding questions.";
    case "engineering_manager":
      return "The role signals ownership and cross-functional influence, so expect questions on execution and leadership.";
    case "behavioral":
      return "Behavioral signal is part of almost every final loop, especially where collaboration and stakeholder alignment matter.";
  }
}

function buildTracks(company: string, role: string, signals: string[]): PrepPlanTrack[] {
  const ordered = inferRelevantKinds(role, signals);

  return ordered.map((kind, index) => ({
    kind,
    title: titleForKind(kind, role, signals),
    rationale: rationaleForKind(kind, signals, role),
    status: "not_started",
    priority: index < 3 ? "core" : "supporting",
    nextActionLabel: nextActionForKind(kind),
    likelyQuestions: likelyQuestionsForKind(kind, company, role),
  }));
}

function buildPlanSummary(company: string, role: string, signals: string[], tracks: PrepPlanTrack[]) {
  const emphasis = [
    signals.includes("architecture") || isSeniorOrAbove(role) ? "design" : null,
    signals.includes("frontend") ? "frontend execution" : null,
    signals.includes("backend") ? "backend depth" : null,
    signals.includes("leadership") ? "leadership signals" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const stages = tracks
    .map((track) => track.title ?? track.kind)
    .join(", ");

  return emphasis
    ? `${company} likely evaluates this ${role} loop through ${stages}. The prep sequence emphasizes ${emphasis}, based on the role and JD.`
    : `${company} likely evaluates this ${role} loop through ${stages}. The prep sequence is trimmed to the rounds that look most relevant for the company, role, and JD.`;
}

export function createPrepPlan(input: PrepPlanInput): PrepPlanSummary {
  const company = input.company.trim();
  const role = input.role.trim();
  const jdText = input.jdText.trim();
  const jdSignals = extractSignals(role, jdText);
  const tracks = buildTracks(company, role, jdSignals);
  const now = new Date().toISOString();
  const id = `${slugify(company)}-${slugify(role)}-${Date.now()}`;
  const nextRecommendedKind = tracks[0]?.kind ?? "dsa";

  return {
    id,
    label: `${company} · ${role}`,
    company,
    role,
    jdText,
    jdSignals,
    planSummary: buildPlanSummary(company, role, jdSignals, tracks),
    status: "active",
    createdAt: now,
    updatedAt: now,
    nextRecommendedKind,
    nextActionLabel: tracks[0]?.nextActionLabel ?? "Start your prep plan",
    tracks,
  };
}

export function markPrepPlanTrackStarted(
  plan: PrepPlanSummary,
  kind: PracticeInterviewKind
): PrepPlanSummary {
  const updatedTracks = plan.tracks.map((track) => {
    if (track.kind !== kind) return track;

    if (track.status === "completed") return track;

    return {
      ...track,
      status: "in_progress" as const,
    };
  });

  const nextTrack =
    updatedTracks.find((track) => track.status !== "completed") ?? updatedTracks[0];

  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    nextRecommendedKind: nextTrack?.kind ?? plan.nextRecommendedKind,
    nextActionLabel: nextTrack?.nextActionLabel ?? plan.nextActionLabel,
    tracks: updatedTracks,
  };
}
