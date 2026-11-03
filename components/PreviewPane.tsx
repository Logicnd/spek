"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import katex from "katex";
import { ChartRenderer } from "./ChartRenderer";
import { Copy, Check, Eye } from "lucide-react";

interface PreviewPaneProps {
  markdown: string;
  isScrubbed: boolean;
  onToggleScrub: () => void;
  scrubCount: number;
}

interface Segment {
  isChart: boolean;
  chartType?: "bar" | "line" | "histogram";
  chartContent?: string;
  htmlContent?: string;
}

/**
 * Configure marked for GFM specifications
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Robust compiler converting Markdown + KaTeX Math to clean GFM HTML
 */
export function compileMarkdownToHtml(rawMarkdown: string): string {
  if (!rawMarkdown) return "";

  let processed = rawMarkdown;
  const mathTokens: { token: string; html: string }[] = [];
  let tokenCounter = 0;

  // 1. Tokenize display math $$...$$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
    const token = `%%KATEX_DISPLAY_${tokenCounter++}%%`;
    try {
      const rendered = katex.renderToString(equation.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      mathTokens.push({ token, html: rendered });
    } catch {
      mathTokens.push({
        token,
        html: `<div class="katex-error text-spek-red font-mono text-xs my-2">${equation}</div>`,
      });
    }
    return token;
  });

  // 2. Tokenize inline math $...$ (negative lookbehind for escaped dollar)
  processed = processed.replace(/(?<!\\)\$([^$\n]+?)\$/g, (_, equation) => {
    const token = `%%KATEX_INLINE_${tokenCounter++}%%`;
    try {
      const rendered = katex.renderToString(equation.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      mathTokens.push({ token, html: rendered });
    } catch {
      mathTokens.push({
        token,
        html: `<span class="katex-error text-spek-red font-mono text-xs">${equation}</span>`,
      });
    }
    return token;
  });

  // 3. Parse Markdown via marked
  let htmlOutput = marked.parse(processed) as string;

  // 4. Restore KaTeX formulas
  for (const item of mathTokens) {
    // Handle marked wrapping block tokens in <p>...</p>
    htmlOutput = htmlOutput.replace(item.token, item.html);
  }

  // 5. Enhance Redacted Tokens with industrial badge styling
  htmlOutput = htmlOutput.replace(
    /(\[REDACTED_[A-Z0-9_]+\])/g,
    `<span class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-950/80 text-red-300 border border-red-700/60 select-all" title="Confidential token redacted by Spek Compliance Engine">$1</span>`
  );

  return htmlOutput;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  markdown,
  isScrubbed,
  onToggleScrub,
  scrubCount,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Parse markdown into alternating prose and chart segments
  const segments = useMemo<Segment[]>(() => {
    if (!markdown) return [];

    const regex = /```chart-(bar|line|histogram)\s*([\s\S]*?)```/g;
    const parts: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
      // Preceding markdown text
      if (match.index > lastIndex) {
        const textSlice = markdown.substring(lastIndex, match.index);
        parts.push({
          isChart: false,
          htmlContent: compileMarkdownToHtml(textSlice),
        });
      }

      // Chart block
      const type = match[1] as "bar" | "line" | "histogram";
      const chartData = match[2];
      parts.push({
        isChart: true,
        chartType: type,
        chartContent: chartData,
      });

      lastIndex = regex.lastIndex;
    }

    // Remaining markdown text
    if (lastIndex < markdown.length) {
      const remainingSlice = markdown.substring(lastIndex);
      parts.push({
        isChart: false,
        htmlContent: compileMarkdownToHtml(remainingSlice),
      });
    }

    return parts;
  }, [markdown]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-spek-panel border border-spek-border overflow-hidden">
      {/* Preview Header Bar */}
      <div className="px-3 py-1.5 bg-spek-elevated border-b border-spek-border flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-spek-emerald" />
          <span className="font-semibold text-white tracking-wider">COMPILED PREVIEW</span>
          {isScrubbed && (
            <span className="px-1.5 py-0.2 bg-red-950/60 text-red-300 border border-red-800/60 text-[10px] rounded-sm">
              SCRUBBED ({scrubCount})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1 text-[11px] text-spek-muted hover:text-white transition-colors"
            title="Copy current markdown"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-spek-emerald" />
                <span className="text-spek-emerald">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy MD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compiled Content Body */}
      <div className="flex-1 p-6 overflow-y-auto selection:bg-spek-blue/30 selection:text-white">
        <div className="spek-preview-prose max-w-none">
          {segments.map((segment, index) => {
            if (segment.isChart && segment.chartType && segment.chartContent) {
              return (
                <ChartRenderer
                  key={index}
                  type={segment.chartType}
                  rawContent={segment.chartContent}
                />
              );
            }

            return (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: segment.htmlContent || "" }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

