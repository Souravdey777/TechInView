import type { RoundScoreDimension, RoundType } from "@/lib/constants";
import type { InterviewPhase } from "@/lib/interview-phases";
import type { WorkspaceSection } from "./types";

export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  coding: "Coding",
  technical_qa: "Technical Q&A",
  behavioral: "Behavioral",
  hiring_manager: "Engineering Manager",
  system_design: "System Design",
};

export const ROUND_TYPE_DESCRIPTIONS: Record<RoundType, string> = {
  coding: "Live coding with problem solving, execution, and testing under pressure.",
  technical_qa: "Voice-led technical questioning focused on language depth, framework tradeoffs, debugging judgment, and practical engineering reasoning.",
  behavioral: "Story-driven interview focused on ownership, communication, and judgment.",
  hiring_manager: "Leadership and role-fit conversation focused on prioritization, stakeholder management, decision-making, and collaboration.",
  system_design: "Architecture discussion focused on requirements, tradeoffs, and scaling decisions.",
};

export const LOOP_SCORING_DIMENSIONS: Record<
  RoundScoreDimension,
  { label: string; weight: number; description: string }
> = {
  problem_solving: {
    label: "Problem Solving",
    weight: 0.24,
    description: "How clearly the candidate framed the problem and found a strong path forward.",
  },
  communication: {
    label: "Communication",
    weight: 0.2,
    description: "How clearly they structured explanations, tradeoffs, and updates under pressure.",
  },
  technical_depth: {
    label: "Technical Depth",
    weight: 0.22,
    description: "How well they reasoned about core concepts, tradeoffs, and constraints.",
  },
  execution: {
    label: "Execution",
    weight: 0.2,
    description: "How effectively they turned thinking into concrete progress during the round.",
  },
  judgment: {
    label: "Judgment",
    weight: 0.14,
    description: "How strong their prioritization, tradeoff choices, and decision quality were.",
  },
};

export const ROUND_PHASE_LABELS: Record<RoundType, Record<InterviewPhase, string>> = {
  coding: {
    INTRO: "Introduction",
    PROBLEM_PRESENTED: "Problem",
    CLARIFICATION: "Clarification",
    APPROACH_DISCUSSION: "Approach",
    CODING: "Coding",
    TESTING: "Testing",
    COMPLEXITY_ANALYSIS: "Complexity",
    FOLLOW_UP: "Follow-up",
    WRAP_UP: "Wrap-up",
  },
  technical_qa: {
    INTRO: "Introduction",
    PROBLEM_PRESENTED: "Question Setup",
    CLARIFICATION: "Context",
    APPROACH_DISCUSSION: "Answer Structure",
    CODING: "Deep Dive",
    TESTING: "Scenario Challenge",
    COMPLEXITY_ANALYSIS: "Tradeoffs",
    FOLLOW_UP: "Follow-up",
    WRAP_UP: "Wrap-up",
  },
  behavioral: {
    INTRO: "Introduction",
    PROBLEM_PRESENTED: "Prompt",
    CLARIFICATION: "Context",
    APPROACH_DISCUSSION: "Story Setup",
    CODING: "Deep Dive",
    TESTING: "Reflection",
    COMPLEXITY_ANALYSIS: "Tradeoffs",
    FOLLOW_UP: "Follow-up",
    WRAP_UP: "Wrap-up",
  },
  hiring_manager: {
    INTRO: "Introduction",
    PROBLEM_PRESENTED: "Prompt",
    CLARIFICATION: "Role Context",
    APPROACH_DISCUSSION: "Discussion",
    CODING: "Deep Dive",
    TESTING: "Signals",
    COMPLEXITY_ANALYSIS: "Priorities",
    FOLLOW_UP: "Follow-up",
    WRAP_UP: "Wrap-up",
  },
  system_design: {
    INTRO: "Introduction",
    PROBLEM_PRESENTED: "Design Prompt",
    CLARIFICATION: "Requirements",
    APPROACH_DISCUSSION: "High-Level Design",
    CODING: "Deep Dive",
    TESTING: "Bottlenecks",
    COMPLEXITY_ANALYSIS: "Tradeoffs",
    FOLLOW_UP: "Extension",
    WRAP_UP: "Wrap-up",
  },
};

const BEHAVIORAL_WORKSPACE: WorkspaceSection[] = [
  {
    id: "situation",
    label: "Situation",
    placeholder: "What was the context, scope, and why did it matter?",
  },
  {
    id: "action",
    label: "Action",
    placeholder: "What did you do directly, and what tradeoffs did you make?",
  },
  {
    id: "result",
    label: "Result",
    placeholder: "What changed, what metrics moved, and what did you learn?",
  },
  {
    id: "reflection",
    label: "Reflection",
    placeholder: "What would you do differently with hindsight?",
  },
];

const TECHNICAL_QA_WORKSPACE: WorkspaceSection[] = [
  {
    id: "core-concepts",
    label: "Core Concepts",
    placeholder: "What concepts, primitives, or internals do you want to explain clearly if asked?",
  },
  {
    id: "framework-tradeoffs",
    label: "Framework Tradeoffs",
    placeholder: "What tradeoffs, runtime behavior, or abstractions matter in your chosen stack?",
  },
  {
    id: "debugging",
    label: "Debugging Signals",
    placeholder: "What debugging workflow, profiling tools, or failure patterns would you talk through?",
  },
  {
    id: "production-judgment",
    label: "Production Judgment",
    placeholder: "What reliability, performance, or rollout considerations should stay top of mind?",
  },
];

const HIRING_MANAGER_WORKSPACE: WorkspaceSection[] = [
  {
    id: "role-fit",
    label: "Role Fit",
    placeholder: "Why are you a fit for this team, company, and role now?",
  },
  {
    id: "impact",
    label: "Impact Stories",
    placeholder: "Which examples best prove ownership, prioritization, and collaboration?",
  },
  {
    id: "tradeoffs",
    label: "Decision Tradeoffs",
    placeholder: "How do you prioritize when speed, quality, and stakeholder needs compete?",
  },
  {
    id: "questions",
    label: "Questions To Ask",
    placeholder: "What thoughtful questions do you want to ask the hiring manager?",
  },
];

const SYSTEM_DESIGN_WORKSPACE: WorkspaceSection[] = [
  {
    id: "requirements",
    label: "Requirements",
    placeholder: "Functional scope, SLAs, traffic assumptions, and success criteria.",
  },
  {
    id: "api-data",
    label: "API / Data Model",
    placeholder: "Core entities, APIs, storage choices, and read/write patterns.",
  },
  {
    id: "architecture",
    label: "Architecture",
    placeholder: "Major components, request flow, and service boundaries.",
  },
  {
    id: "bottlenecks",
    label: "Bottlenecks",
    placeholder: "Expected hotspots, failure modes, and reliability plans.",
  },
  {
    id: "tradeoffs",
    label: "Tradeoffs",
    placeholder: "What did you optimize for, and what did you intentionally defer?",
  },
  {
    id: "scaling",
    label: "Scaling Plan",
    placeholder: "How does the system evolve at 10x or 100x load?",
  },
];

export function getWorkspaceSections(roundType: RoundType): WorkspaceSection[] {
  if (roundType === "behavioral") return BEHAVIORAL_WORKSPACE;
  if (roundType === "technical_qa") return TECHNICAL_QA_WORKSPACE;
  if (roundType === "hiring_manager") return HIRING_MANAGER_WORKSPACE;
  if (roundType === "system_design") return SYSTEM_DESIGN_WORKSPACE;
  return [];
}

export function getPhaseLabelForRound(roundType: RoundType, phase: InterviewPhase): string {
  return ROUND_PHASE_LABELS[roundType][phase];
}
