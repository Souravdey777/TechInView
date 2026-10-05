import type { InterviewerCase } from "./cases";
import { TWO_SUM_LEAK_MARKERS } from "./fixtures";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function gradeInterviewer(c: InterviewerCase, reply: string) {
  const checks = {
    one_question: (reply.match(/\?/g)?.length ?? 0) <= 1,
    no_leak: c.roundType !== "coding" || !TWO_SUM_LEAK_MARKERS.some((re) => re.test(reply)),
    speech_format: !/[*#`{}]|^\s*[-•]\s|\bO\(/m.test(reply),
    case_rules:
      (c.must ?? []).every((re) => re.test(reply)) &&
      !(c.mustNot ?? []).some((re) => re.test(reply)) &&
      (c.maxWords === undefined || words(reply) <= c.maxWords) &&
      reply.trim().length > 0,
  };
  const score = Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v ? 1 : 0])) as Record<keyof typeof checks, number>;
  return { pass: Object.values(checks).every(Boolean) ? 1 : 0, ...score };
}

