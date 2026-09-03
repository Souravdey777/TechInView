/**
 * Problem statements in the catalog are authored as light markdown, and every
 * one of the 70 repeats its examples inside the description as `**Example N:**`
 * plus a fenced block while also carrying a structured `examples[]` array. The
 * structured array is what the room, the solver, the practice page and the
 * JSON-LD all render, so the prose copies have to come out — otherwise every
 * example reads twice on the page.
 *
 * The one thing worth rescuing from those fences is the ASCII tree drawn above
 * the `Input:` line on the tree problems. It has no home in `examples[]`, and
 * dropping it silently costs the reader the whole picture of the input.
 */

/** Matches `**Example 1:**`, `**Example:**`, `**Example 2 (edge case):**`. */
const EXAMPLE_MARKER = /\*\*Example\s*\d*[^\n]*\*\*/;
const EXAMPLE_MARKER_ALL = new RegExp(EXAMPLE_MARKER.source, "g");
const FENCE = /```(?:[a-zA-Z]*\n)?([\s\S]*?)```/;
const INPUT_LINE = /^\s*Input\s*:/;

/** The statement prose, with the duplicated example blocks removed. */
export function stripEmbeddedExamples(description: string): string {
  const match = EXAMPLE_MARKER.exec(description);
  return (match ? description.slice(0, match.index) : description).trim();
}

type EmbeddedExample = {
  /** Everything above the `Input:` line — an ASCII diagram where present. */
  diagram: string;
  input: string;
};

/** The examples as written in the prose, in the order they appear. */
export function parseEmbeddedExamples(description: string): EmbeddedExample[] {
  const marker = EXAMPLE_MARKER.exec(description);
  if (!marker) return [];

  return description
    .slice(marker.index)
    .split(EXAMPLE_MARKER_ALL)
    .flatMap((block) => {
      const fence = FENCE.exec(block);
      if (!fence) return [];

      const lines = fence[1].replace(/^\n+|\n+$/g, "").split("\n");
      const inputAt = lines.findIndex((line) => INPUT_LINE.test(line));
      if (inputAt < 0) return [];

      return [
        {
          diagram: lines.slice(0, inputAt).join("\n").trimEnd(),
          input: lines[inputAt].replace(INPUT_LINE, "").trim(),
        },
      ];
    });
}

function sameInput(a: string | undefined, b: string | undefined): boolean {
  return (a ?? "").replace(/\s+/g, "") === (b ?? "").replace(/\s+/g, "");
}

/**
 * Diagram for each structured example, aligned by position. The two lists were
 * authored separately and diverge in length and content on a third of the
 * catalog, so a diagram is only carried over when the inputs agree — a diagram
 * of the wrong tree is worse than no diagram.
 */
export function diagramsForExamples(
  description: string,
  examples: { input?: string }[]
): (string | undefined)[] {
  const embedded = parseEmbeddedExamples(description);

  return examples.map((example, i) => {
    const candidate = embedded[i];
    if (!candidate?.diagram || !sameInput(candidate.input, example.input)) {
      return undefined;
    }
    return candidate.diagram;
  });
}
