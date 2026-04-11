import { sanitizeJdText } from "./generator";

const MIN_PRINTABLE_RATIO = 0.65;

function printableRatio(value: string): number {
  if (!value) return 0;

  const printable = value
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
    }).length;

  return printable / value.length;
}

function extractPdfText(buffer: ArrayBuffer): string {
  const text = new TextDecoder("latin1").decode(buffer);
  const matches = Array.from(text.matchAll(/\(([^()]{4,})\)/g))
    .map((match) => match[1]?.replace(/\\[rn]/g, " ").replace(/\\\(/g, "(").replace(/\\\)/g, ")"))
    .filter(Boolean) as string[];

  return matches.join(" ");
}

export async function parseJdFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  if (
    fileType.startsWith("text/") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".rtf")
  ) {
    const text = sanitizeJdText(await file.text());
    if (!text) {
      throw new Error("The uploaded file was empty.");
    }
    return text;
  }

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const text = sanitizeJdText(extractPdfText(buffer));
    if (text.length < 120) {
      throw new Error("PDF extraction was too weak. Paste the JD text directly for the best result.");
    }
    return text;
  }

  const text = sanitizeJdText(await file.text());
  if (!text || printableRatio(text) < MIN_PRINTABLE_RATIO) {
    throw new Error("This upload format is not supported yet. Upload a text-based JD or paste the JD directly.");
  }

  return text;
}
