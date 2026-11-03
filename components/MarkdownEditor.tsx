"use client";

import React, { useRef, useEffect } from "react";
import {
  Heading1,
  Heading2,
  Bold,
  Code,
  Table as TableIcon,
  Sigma,
  BarChart2,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onUndo,
  canUndo = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Generate line numbers array
  const lineCount = value.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Helper to insert markdown syntax at cursor
  const insertSyntax = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || placeholder;

    const replacement = `${before}${selected}${after}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-spek-panel border border-spek-border overflow-hidden">
      {/* Editor Micro-Toolbar */}
      <div className="px-2 py-1.5 bg-spek-elevated border-b border-spek-border flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertSyntax("# ", "", "Heading 1")}
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax("## ", "", "Heading 2")}
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-spek-border mx-0.5">|</span>
          <button
            onClick={() => insertSyntax("**", "**", "bold text")}
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax("`", "`", "code")}
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <span className="text-spek-border mx-0.5">|</span>
          <button
            onClick={() =>
              insertSyntax(
                "\n| Metric | Baseline | Target |\n|---|---|---|\n| Latency | 45ms | 20ms |\n"
              )
            }
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              insertSyntax("\n$$\nA = \\frac{MTBF}{MTBF + MTTR} \\times 100\\%\n$$\n")
            }
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Insert KaTeX Formula"
          >
            <Sigma className="w-3.5 h-3.5 text-spek-emerald" />
          </button>
          <button
            onClick={() =>
              insertSyntax(
                "\n```chart-bar\nService,Latency_ms\nauth,24.5\nbilling,89.2\norder,120.4\n```\n"
              )
            }
            className="p-1 hover:bg-spek-subtle hover:text-white text-spek-muted rounded-sm transition-colors"
            title="Insert D3 Chart Block"
          >
            <BarChart2 className="w-3.5 h-3.5 text-spek-blue" />
          </button>
          <button
            onClick={() =>
              insertSyntax("AKIAIOSFODNN7EXAMPLE", "", "")
            }
            className="p-1 hover:bg-spek-subtle hover:text-spek-amber text-spek-muted rounded-sm transition-colors"
            title="Insert Test AWS Secret Key"
          >
            <Lock className="w-3.5 h-3.5 text-spek-amber" />
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 text-[11px] text-spek-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="Undo last snapshot"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
          <span className="text-[11px] text-spek-dim">GFM Markdown</span>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 bg-spek-bg/80 border-r border-spek-border/60 py-3 select-none overflow-hidden font-mono text-xs text-right pr-3 text-spek-dim leading-relaxed"
        >
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Raw Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="flex-1 bg-spek-panel p-3 font-mono text-xs text-spek-text leading-relaxed outline-none resize-none overflow-y-auto selection:bg-spek-blue/30 selection:text-white"
          placeholder="Type or paste markdown runbook specification..."
        />
      </div>
    </div>
  );
};

