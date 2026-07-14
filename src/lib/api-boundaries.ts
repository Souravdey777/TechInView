import { CREDIT_PACKS } from "@/lib/constants";
import type { Problem } from "@/lib/db/schema";

export function toPublicInterviewProblem(problem: Problem) {
  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    category: problem.category,
    description: problem.description,
    examples: problem.examples,
    constraints: problem.constraints,
    starter_code: problem.starter_code,
    hints: problem.hints,
    optimal_complexity: problem.optimal_complexity,
    follow_up_questions: problem.follow_up_questions,
  };
}

export function isPaymentBoundToUser(params: {
  pack: string;
  credits: number;
  paymentUserId?: string;
  authenticatedUserId: string;
  paymentOrderId?: string | null;
  submittedOrderId: string;
}): boolean {
  const creditPack = CREDIT_PACKS[params.pack as keyof typeof CREDIT_PACKS];

  return Boolean(
    creditPack &&
      params.credits === creditPack.credits &&
      params.paymentUserId === params.authenticatedUserId &&
      params.paymentOrderId === params.submittedOrderId
  );
}
