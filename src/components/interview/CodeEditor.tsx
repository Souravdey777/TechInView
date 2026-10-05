"use client";

import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ChevronDown, Loader2 } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-brand-deep">
      <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
    </div>
  ),
});
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SupportedLanguage = "python" | "javascript" | "java" | "cpp";

type CodeEditorProps = {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  onRunCode: () => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
};

// ─── Language display map ─────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
};

// Monaco uses slightly different language IDs
const MONACO_LANGUAGE: Record<SupportedLanguage, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
};

const ALL_LANGUAGES: SupportedLanguage[] = [
  "python",
  "javascript",
  "java",
  "cpp",
];

// ─── Monaco options ───────────────────────────────────────────────────────────

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  fontFamily: '"Geist Mono", ui-monospace, monospace',
  fontLigatures: true,
  minimap: { enabled: false },
  wordWrap: "on",
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  renderLineHighlight: "gutter",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  tabSize: 4,
  detectIndentation: true,
  padding: { top: 16, bottom: 16 },
  lineHeight: 1.7,
  letterSpacing: 0,
  bracketPairColorization: { enabled: true },
  renderWhitespace: "none",
  overviewRulerLanes: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CodeEditor({
  language,
  value,
  onChange,
  onRunCode,
  onLanguageChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;

      // Register Cmd/Ctrl+Enter keybinding
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          onRunCode();
        }
      );

      // Dark theme on the design-system ink (brand-deep #0A0B0D), cool greys
      monaco.editor.defineTheme("techinview-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "5B6068", fontStyle: "italic" },
          { token: "keyword", foreground: "22d3ee" },
          { token: "string", foreground: "34d399" },
          { token: "number", foreground: "fbbf24" },
          { token: "type", foreground: "f472b6" },
        ],
        colors: {
          "editor.background": "#0A0B0D",
          "editor.foreground": "#D5D8DC",
          "editor.lineHighlightBackground": "#0E1013",
          "editor.selectionBackground": "#22D3EE22",
          "editor.inactiveSelectionBackground": "#22D3EE11",
          "editorCursor.foreground": "#22D3EE",
          "editorLineNumber.foreground": "#3E434A",
          "editorLineNumber.activeForeground": "#8E939B",
          "editorIndentGuide.background": "#1E1F22",
          "editorIndentGuide.activeBackground": "#2A2C30",
          "scrollbarSlider.background": "#1E1F22",
          "scrollbarSlider.hoverBackground": "#2A2C30",
        },
      });
      monaco.editor.setTheme("techinview-dark");
    },
    [onRunCode]
  );

  return (
    <div className="flex h-full flex-col bg-brand-deep">
      {/* Toolbar: mono pane label + language pill */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
          Solution Editor
        </span>

        {/* Language selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) =>
              onLanguageChange(e.target.value as SupportedLanguage)
            }
            className={cn(
              "appearance-none rounded-full border border-white/[0.12] bg-brand-deep",
              "py-1 pl-3 pr-7 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-text",
              "focus:border-brand-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40",
              "cursor-pointer transition-colors hover:border-white/[0.24]"
            )}
          >
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-brand-muted" />
        </div>
      </div>

      {/* Monaco */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          theme="techinview-dark"
          options={EDITOR_OPTIONS}
          loading={
            <div className="flex h-full items-center justify-center bg-brand-deep">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
                  Loading editor…
                </span>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
