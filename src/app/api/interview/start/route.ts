import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type StartInterviewBody = {
  problemId?: string;
  difficulty?: string;
  category?: string;
  language: string;
  maxDuration?: number;
};

type MockProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starter_code: Record<string, string>;
  optimal_complexity: { time: string; space: string };
  hints: string[];
};

const TWO_SUM_PROBLEM: MockProblem = {
  id: "demo-problem-two-sum",
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "easy",
  category: "arrays",
  description:
    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  starter_code: {
    python:
      "from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n",
    javascript:
      "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};\n",
    java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}\n",
    cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};\n",
  },
  optimal_complexity: { time: "O(n)", space: "O(n)" },
  hints: [
    "A brute force solution checks every pair — what is its time complexity?",
    "Can you trade space for time? Think about what data structure allows O(1) lookups.",
    "For each element, check if `target - element` already exists in a hash map.",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as StartInterviewBody;
    const { language, maxDuration = 2700 } = body;

    if (!language) {
      return NextResponse.json(
        { success: false, error: "language is required" },
        { status: 400 }
      );
    }

    // TODO: Query problems table by problemId / difficulty / category when DB is seeded.
    // For now, return a demo interview with the Two Sum problem.
    const interviewId = `demo-interview-${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        interviewId,
        problem: TWO_SUM_PROBLEM,
        language,
        maxDuration,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Failed to start interview" },
      { status: 500 }
    );
  }
}
