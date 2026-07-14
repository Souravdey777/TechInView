import assert from "node:assert/strict";
import test from "node:test";
import { isPaymentBoundToUser, toPublicInterviewProblem } from "../api-boundaries";
import type { Problem } from "../db/schema";

test("public interview problems omit confidential solution material", () => {
  const problem = {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    category: "arrays",
    description: "Find two values.",
    examples: [],
    constraints: [],
    starter_code: {},
    test_cases: [{ input: "hidden", expected_output: "hidden", is_hidden: true }],
    solution_approach: "Use a hash map.",
    hints: [],
    optimal_complexity: { time: "O(n)", space: "O(n)" },
    follow_up_questions: [],
    company_tags: [],
    is_free_solver_enabled: false,
    created_at: new Date(),
  } satisfies Problem;

  const result = toPublicInterviewProblem(problem);

  assert.equal("test_cases" in result, false);
  assert.equal("solution_approach" in result, false);
});

test("payment binding requires the expected user, order, pack, and credits", () => {
  const valid = {
    pack: "3pack",
    credits: 3,
    paymentUserId: "user-1",
    authenticatedUserId: "user-1",
    paymentOrderId: "order-1",
    submittedOrderId: "order-1",
  };

  assert.equal(isPaymentBoundToUser(valid), true);
  assert.equal(isPaymentBoundToUser({ ...valid, authenticatedUserId: "user-2" }), false);
  assert.equal(isPaymentBoundToUser({ ...valid, submittedOrderId: "order-2" }), false);
  assert.equal(isPaymentBoundToUser({ ...valid, credits: 6 }), false);
});
