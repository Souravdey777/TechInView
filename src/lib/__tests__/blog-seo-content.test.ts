import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import matter from "gray-matter";
import { extractFaq } from "../blog-taxonomy";
import { buildFaqPageNode, serializeJsonLd } from "../blog-seo";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

/** Google truncates around 60; the budget is what keeps titles whole. */
const SEO_TITLE_BUDGET = 60;

function allPosts() {
  return readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const { data, content } = matter(
        readFileSync(path.join(BLOG_DIR, file), "utf8")
      );
      return { file, fm: data as Record<string, string>, body: content };
    });
}

test("extractFaq pairs each FAQ question with its answer", () => {
  const faq = extractFaq(
    [
      "## Intro",
      "",
      "### Not a FAQ question",
      "",
      "## FAQ",
      "",
      "### First question?",
      "",
      "Short answer.",
      "",
      "### Second question?",
      "",
      "Another answer.",
      "",
      "---",
      "",
      "**Summary:** trailing copy is not an answer.",
    ].join("\n")
  );

  assert.deepEqual(faq, [
    { question: "First question?", answer: "Short answer." },
    { question: "Second question?", answer: "Another answer." },
  ]);
});

test("extractFaq strips block markers on every line, not just the first", () => {
  const [entry] = extractFaq(
    [
      "## FAQ",
      "",
      "### Does it flatten lists?",
      "",
      "Yes.",
      "- first item",
      "2. second item",
      "> quoted aside",
    ].join("\n")
  );

  assert.equal(entry.answer, "Yes. first item second item quoted aside");
});

test("extractFaq reduces inline markdown to plain text", () => {
  const [entry] = extractFaq(
    [
      "## FAQ",
      "",
      "### What about inline markup?",
      "",
      "Use **bold**, `code`, and a [link](/blog/other) freely.",
      "",
      "| col | col |",
      "|-----|-----|",
      "| a   | b   |",
    ].join("\n")
  );

  assert.equal(entry.answer, "Use bold, code, and a link freely.");
});

test("extractFaq accepts the FAQ heading variants a writer might use", () => {
  for (const heading of ["## FAQ", "## FAQs", "## Frequently Asked Questions"]) {
    const faq = extractFaq([heading, "", "### Q?", "", "A."].join("\n"));
    assert.equal(faq.length, 1, `no FAQ parsed from "${heading}"`);
  }
});

test("extractFaq ignores questions outside the FAQ section", () => {
  const faq = extractFaq(
    ["## FAQ", "", "### Inside?", "", "Yes.", "", "## Summary", "", "### Outside?", "", "No."].join("\n")
  );

  assert.deepEqual(faq.map((entry) => entry.question), ["Inside?"]);
});

test("serializeJsonLd escapes angle brackets so a script tag cannot close early", () => {
  const serialized = serializeJsonLd({ text: "</script><img onerror=1>" });

  assert.ok(!serialized.includes("</script>"));
  assert.ok(serialized.includes("\\u003c/script"));
});

test("buildFaqPageNode emits one Question per pair", () => {
  const node = buildFaqPageNode("https://example.com#faq", [
    { question: "Q?", answer: "A." },
  ]) as {
    "@id": string;
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };

  assert.equal(node["@id"], "https://example.com#faq");
  assert.equal(node.mainEntity.length, 1);
  assert.equal(node.mainEntity[0].name, "Q?");
  assert.equal(node.mainEntity[0].acceptedAnswer.text, "A.");
});

test("every post's seoTitle fits the search-result budget", () => {
  for (const { file, fm } of allPosts()) {
    assert.ok(fm.seoTitle, `${file} has no seoTitle`);
    assert.ok(
      fm.seoTitle.length <= SEO_TITLE_BUDGET,
      `${file} seoTitle is ${fm.seoTitle.length} chars (budget ${SEO_TITLE_BUDGET})`
    );
  }
});

test("every FAQ answer reaches schema as plain text", () => {
  for (const { file, body } of allPosts()) {
    for (const entry of extractFaq(body)) {
      assert.ok(entry.answer.length > 0, `${file}: empty answer`);
      assert.doesNotMatch(
        entry.answer,
        /\*\*|`|\]\(|^\s*[-*+]\s/,
        `${file}: markdown survived into "${entry.question}"`
      );
    }
  }
});
