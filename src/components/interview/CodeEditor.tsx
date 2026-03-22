"use client";

import { useRef, useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ChevronDown, Loader2 } from "lucide-react";
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
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
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
  letterSpacing: 0.5,
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

      // Dark theme customisation
      monaco.editor.defineTheme("techinview-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "4a5568", fontStyle: "italic" },
          { token: "keyword", foreground: "22d3ee" },
          { token: "string", foreground: "34d399" },
          { token: "number", foreground: "fbbf24" },
          { token: "type", foreground: "f472b6" },
        ],
        colors: {
          "editor.background": "#0d1017",
          "editor.foreground": "#e2e8f0",
          "editor.lineHighlightBackground": "#111820",
          "editor.selectionBackground": "#22d3ee22",
          "editor.inactiveSelectionBackground": "#22d3ee11",
          "editorCursor.foreground": "#22d3ee",
          "editorLineNumber.foreground": "#2d3748",
          "editorLineNumber.activeForeground": "#7a8ba3",
          "editorIndentGuide.background": "#1a2332",
          "editorIndentGuide.activeBackground": "#2d3748",
          "scrollbarSlider.background": "#1a2332",
          "scrollbarSlider.hoverBackground": "#2d3748",
        },
      });
      monaco.editor.setTheme("techinview-dark");
    },
    [onRunCode]
  );

  return (
    <div className="flex h-full flex-col bg-brand-surface">
      {/* Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-brand-border bg-brand-card px-4">
        <span className="text-xs font-medium text-brand-muted">
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
              "appearance-none rounded-md border border-brand-border bg-brand-surface",
              "py-1 pl-3 pr-7 text-xs font-medium text-brand-text",
              "focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30",
              "cursor-pointer hover:border-brand-subtle transition-colors"
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
            <div className="flex h-full items-center justify-center bg-brand-surface">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
                <span className="text-xs text-brand-muted">
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
