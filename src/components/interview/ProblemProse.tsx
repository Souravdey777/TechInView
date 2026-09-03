import type { ReactNode } from "react";

import { stripEmbeddedExamples } from "@/lib/problems/statement";

/**
 * Problem statements are authored as light markdown — inline `code`, **bold**,
 * and fenced blocks. Rendering them raw showed candidates literal backticks and
 * asterisks, so this renders the small subset actually used across the catalog.
 *
 * Deliberately not a markdown library: this runs in the interview room, the
 * grammar in use is tiny, and the room should not carry a parser it barely uses.
 */

/** Splits a paragraph on `code` and **bold** spans, keeping the delimiters. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      out.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("`")) {
      out.push(
        <code
          key={`${keyPrefix}-c${i++}`}
          className="rounded bg-brand-card px-1.5 py-0.5 font-mono text-[0.9em] text-brand-cyan"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      out.push(
        <strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-brand-text">
          {token.slice(2, -2)}
        </strong>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    out.push(text.slice(last));
  }
  return out;
}

/**
 * Constraints are written with caret exponents (`10^4`). Render them as real
 * superscripts so `2 <= nums.length <= 10^4` reads the way it would on paper.
 */
export function renderConstraint(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\d)\^(\d+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(
      <span key={`${keyPrefix}-s${i++}`}>
        {match[1]}
        <sup className="text-[0.75em]">{match[2]}</sup>
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Re-exported so the panel and the practice page strip the same duplicated
 * example blocks. The parsing itself lives in `lib/problems/statement`.
 */
export { stripEmbeddedExamples };

export function ProblemProse({ description }: { description: string }) {
  const blocks = stripEmbeddedExamples(description).split(/```/);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        // odd indices are the inside of a fenced block
        if (blockIndex % 2 === 1) {
          const code = block.replace(/^[a-zA-Z]*\n/, "").replace(/\s+$/, "");
          if (!code) return null;
          return (
            <pre
              key={blockIndex}
              className="overflow-x-auto rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 font-mono text-xs leading-relaxed text-brand-text"
            >
              {code}
            </pre>
          );
        }

        const paragraphs = block.split(/\n{2,}/).filter((p) => p.trim());
        if (paragraphs.length === 0) return null;

        return (
          <div key={blockIndex} className="space-y-3">
            {paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-brand-muted [text-wrap:pretty]"
              >
                {renderInline(paragraph.trim(), `${blockIndex}-${i}`)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
