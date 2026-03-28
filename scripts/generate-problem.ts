import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const PROBLEMS_DIR = path.join(process.cwd(), "src/data/problems");

const PROBLEM_SCHEMA = `{
  "title": string,
  "slug": string (kebab-case, unique),
  "difficulty": "easy" | "medium" | "hard",
  "category": string (one of: arrays, strings, trees, graphs, dp, linked-lists, stacks-queues, binary-search, heap, backtracking, sliding-window, trie),
  "company_tags": string[] (from: google, amazon, meta, apple, microsoft, netflix, bloomberg, linkedin, uber, goldman-sachs, adobe, oracle),
  "description": string (markdown with examples embedded),
  "examples": [{ "input": string, "output": string, "explanation": string }] (2-3 examples),
  "constraints": string[] (3-5 constraints),
  "starter_code": {
    "python": string,
    "javascript": string,
    "java": string,
    "cpp": string
  },
  "test_cases": [{ "input": string, "expected_output": string, "is_hidden": boolean }] (3 visible + 2 hidden),
  "solution_approach": string (detailed paragraph covering brute force and optimal),
  "hints": string[] (3 progressive hints, from vague to specific),
  "optimal_complexity": { "time": string, "space": string },
  "follow_up_questions": string[] (2 follow-up questions)
}`;

const SYSTEM_PROMPT = `You are a FAANG interview problem designer. Generate a single DSA coding problem as a JSON object.

Requirements:
- The problem must be a well-known, classic coding interview problem (like those on LeetCode/NeetCode).
- Description should be clear, with embedded examples in markdown code blocks.
- Starter code must compile/parse in all 4 languages. Use class-based for Python/Java/C++, function-based for JavaScript.
- Test cases: 3 visible (is_hidden: false) + 2 hidden edge cases (is_hidden: true).
- Test case inputs/outputs must be formatted as human-readable strings (e.g., "nums = [1,2,3], target = 6").
- Solution approach must cover both brute-force and optimal approaches with complexity analysis.
- Hints must be progressive: hint 1 is vague, hint 2 is medium, hint 3 nearly gives the approach.
- company_tags should reflect companies that actually ask this problem.
- C++ starter code should NOT include #include headers — just the class/function.

Output ONLY valid JSON matching this schema:
${PROBLEM_SCHEMA}

No markdown fences, no explanation — just the raw JSON object.`;

function getExistingSlugs(): Set<string> {
  if (!fs.existsSync(PROBLEMS_DIR)) return new Set();
  return new Set(
    fs.readdirSync(PROBLEMS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
  );
}

function validateProblem(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const required = [
    "title", "slug", "difficulty", "category", "description",
    "examples", "constraints", "starter_code", "test_cases",
    "solution_approach", "hints", "optimal_complexity", "follow_up_questions",
  ];

  for (const field of required) {
    if (!(field in data)) errors.push(`Missing field: ${field}`);
  }

  if (data.difficulty && !["easy", "medium", "hard"].includes(data.difficulty as string)) {
    errors.push(`Invalid difficulty: ${data.difficulty}`);
  }

  const sc = data.starter_code as Record<string, unknown> | undefined;
  if (sc && typeof sc === "object") {
    for (const lang of ["python", "javascript", "java", "cpp"]) {
      if (!sc[lang]) errors.push(`Missing starter_code.${lang}`);
    }
  }

  if (Array.isArray(data.test_cases)) {
    const visible = (data.test_cases as Array<Record<string, unknown>>).filter((t) => !t.is_hidden);
    const hidden = (data.test_cases as Array<Record<string, unknown>>).filter((t) => t.is_hidden);
    if (visible.length < 2) errors.push(`Need at least 2 visible test cases, got ${visible.length}`);
    if (hidden.length < 1) errors.push(`Need at least 1 hidden test case, got ${hidden.length}`);
  }

  return errors;
}

async function generateProblem(
  difficulty: string,
  category: string,
  title?: string
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const existingSlugs = getExistingSlugs();

  const userPrompt = title
    ? `Generate the "${title}" problem. Difficulty: ${difficulty}. Category: ${category}.`
    : `Generate a classic FAANG interview problem. Difficulty: ${difficulty}. Category: ${category}. Do NOT generate any of these existing problems: ${[...existingSlugs].join(", ")}`;

  console.log(`\nGenerating: ${title || `${difficulty} ${category} problem`}...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Failed to parse JSON response:");
    console.error(text.slice(0, 500));
    process.exit(1);
  }

  const errors = validateProblem(parsed);
  if (errors.length > 0) {
    console.error("Validation errors:", errors);
    process.exit(1);
  }

  const slug = parsed.slug as string;
  if (existingSlugs.has(slug)) {
    console.error(`Slug "${slug}" already exists. Skipping.`);
    return;
  }

  const filePath = path.join(PROBLEMS_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + "\n");
  console.log(`  Written: ${filePath}`);
  console.log(`  Title: ${parsed.title} (${parsed.difficulty}) — ${parsed.category}`);
}

async function main() {
  const difficulty = process.env.DIFFICULTY || "medium";
  const category = process.env.CATEGORY || "arrays";
  const title = process.env.TITLE;

  console.log("Problem Generator");
  console.log("=".repeat(40));
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Category: ${category}`);
  if (title) console.log(`Title: ${title}`);
  console.log(`Existing problems: ${getExistingSlugs().size}`);

  await generateProblem(difficulty, category, title);
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
