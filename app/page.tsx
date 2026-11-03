"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import cloneDeep from "lodash/cloneDeep";
import {
  FileText,
  Sliders,
  Download,
  Printer,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Columns,
  Maximize2,
  Table,
  Edit3,
  Layers,
  ChevronDown,
  Wifi,
  WifiOff,
  Check,
  Copy,
  FileCode,
  FileSpreadsheet,
  Info,
  X,
  ExternalLink,
} from "lucide-react";

import { MarkdownEditor } from "../components/MarkdownEditor";
import { PreviewPane, compileMarkdownToHtml } from "../components/PreviewPane";
import { DataGrid } from "../components/DataGrid";
import { TEMPLATES } from "../lib/templates";
import { scrubDocument, formatAuditTrailCSV, ScrubResult } from "../lib/scrubber";
import {
  trackEvent,
  calculateDocumentMetrics,
  compileDocumentAuditJSON,
  compileDocumentAuditCSV,
  DocumentMetrics,
} from "../lib/analytics";
import { generateStandaloneReport } from "../lib/compiler";

// Dynamically import Quill editor to avoid SSR window reference
const QuillEditor = dynamic(
  () => import("../components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-spek-dim bg-spek-panel">
        Loading Rich Text Visual Engine...
      </div>
    ),
  }
);

// TanStack Query Client instance
const queryClient = new QueryClient();

type ActiveTab = "markdown" | "quill" | "datagrid";
type ViewMode = "split" | "editor-only" | "preview-only";

export default function SpekWorkbench() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkbenchMain />
    </QueryClientProvider>
  );
}

function WorkbenchMain() {
  // Document state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("incident");
  const [rawMarkdown, setRawMarkdown] = useState<string>(TEMPLATES.incident.markdown);
  const [history, setHistory] = useState<string[]>([TEMPLATES.incident.markdown]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // UI Modes
  const [activeTab, setActiveTab] = useState<ActiveTab>("markdown");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isScrubberEnabled, setIsScrubberEnabled] = useState<boolean>(true);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState<boolean>(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);

  // Network & PWA status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Setup PWA Service Worker & Network Listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => setIsPwaInstalled(true))
          .catch((err) => console.warn("SW Registration:", err));
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Run XRegExp Compliance Scrubber
  const scrubResult: ScrubResult = useMemo(() => {
    return scrubDocument(rawMarkdown);
  }, [rawMarkdown]);

  // Active text to display in preview (scrubbed or raw based on toggle)
  const activeDisplayMarkdown = useMemo(() => {
    return isScrubberEnabled ? scrubResult.scrubbedText : rawMarkdown;
  }, [isScrubberEnabled, scrubResult.scrubbedText, rawMarkdown]);

  // HTML representation for Quill synchronization
  const quillHtml = useMemo(() => {
    return compileMarkdownToHtml(rawMarkdown);
  }, [rawMarkdown]);

  // Computed document audit metrics
  const documentMetrics: DocumentMetrics = useMemo(() => {
    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Technical Specification Runbook";
    return calculateDocumentMetrics(rawMarkdown, scrubResult, null, title);
  }, [rawMarkdown, scrubResult]);

  // Push snapshot to undo stack
  const pushToHistory = useCallback(
    (newVal: string) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        if (next[next.length - 1] !== newVal) {
          return [...next, newVal];
        }
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Debounced markdown update (60fps ~16ms)
  const debouncedUpdate = useMemo(
    () =>
      debounce((newVal: string) => {
        pushToHistory(newVal);
      }, 300),
    [pushToHistory]
  );

  const handleMarkdownChange = (newVal: string) => {
    setRawMarkdown(newVal);
    debouncedUpdate(newVal);
  };

  // Undo support
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevVal = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setRawMarkdown(prevVal);
    }
  };

  // Handle updates from Quill WYSIWYG editor
  const handleQuillChange = (convertedMarkdown: string) => {
    setRawMarkdown(convertedMarkdown);
    debouncedUpdate(convertedMarkdown);
  };

  // Handle Markdown Table Injection from DataGrid
  const handleInjectTable = (tableMarkdown: string) => {
    const updated = `${rawMarkdown}\n\n${tableMarkdown}\n`;
    setRawMarkdown(updated);
    pushToHistory(updated);
    setActiveTab("markdown");
  };

  // Handle Chart Injection from DataGrid
  const handleInjectChart = (chartMarkdown: string) => {
    const updated = `${rawMarkdown}\n\n${chartMarkdown}\n`;
    setRawMarkdown(updated);
    pushToHistory(updated);
    setActiveTab("markdown");
  };

  // Switch document templates
  const handleSelectTemplate = (templateKey: string) => {
    const t = TEMPLATES[templateKey];
    if (t) {
      setSelectedTemplateId(templateKey);
      setRawMarkdown(t.markdown);
      setHistory([t.markdown]);
      setHistoryIndex(0);
      setShowTemplateMenu(false);

      trackEvent({
        event: "template_loaded",
        template_name: t.name,
      });
    }
  };

  // Toggle Scrubber
  const handleToggleScrubber = () => {
    const nextState = !isScrubberEnabled;
    setIsScrubberEnabled(nextState);

    trackEvent({
      event: "secrets_scrubbed",
      scrub_count: scrubResult.matchCount,
      categories_affected: Object.keys(scrubResult.categoryCounts),
    });
  };

  // Export standalone runnable HTML
  const handleExportHTML = () => {
    const compiledHtml = compileMarkdownToHtml(activeDisplayMarkdown);
    const standalone = generateStandaloneReport({
      title: documentMetrics.title,
      compiledContentHtml: compiledHtml,
      rawMarkdown: activeDisplayMarkdown,
      metrics: documentMetrics,
      auditTrail: scrubResult.auditTrail,
      scrubbed: isScrubberEnabled,
    });

    const blob = new Blob([standalone], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentMetrics.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_spek_runbook.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);

    trackEvent({
      event: "report_exported",
      export_format: "html",
      doc_token_count: documentMetrics.tokenEstimate,
      doc_char_count: documentMetrics.characterCount,
      scrub_count: documentMetrics.scrubCount,
      reading_time_seconds: Math.round(documentMetrics.readingDurationMinutes * 60),
    });
  };

  // Export raw Markdown
  const handleExportMarkdown = () => {
    const content = isScrubberEnabled ? scrubResult.scrubbedText : rawMarkdown;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentMetrics.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_spek.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);

    trackEvent({
      event: "report_exported",
      export_format: "md",
      doc_token_count: documentMetrics.tokenEstimate,
      doc_char_count: documentMetrics.characterCount,
      scrub_count: documentMetrics.scrubCount,
      reading_time_seconds: Math.round(documentMetrics.readingDurationMinutes * 60),
    });
  };

  // Export JSON Audit Telemetry
  const handleExportAuditJSON = () => {
    const jsonStr = compileDocumentAuditJSON(documentMetrics, scrubResult.auditTrail);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spek_audit_${documentMetrics.documentHash}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);

    trackEvent({
      event: "report_exported",
      export_format: "audit_json",
      doc_token_count: documentMetrics.tokenEstimate,
      doc_char_count: documentMetrics.characterCount,
      scrub_count: documentMetrics.scrubCount,
      reading_time_seconds: Math.round(documentMetrics.readingDurationMinutes * 60),
    });
  };

  // Export CSV Audit Telemetry
  const handleExportAuditCSV = () => {
    const csvStr = compileDocumentAuditCSV(documentMetrics, scrubResult.auditTrail);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spek_audit_${documentMetrics.documentHash}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);

    trackEvent({
      event: "report_exported",
      export_format: "audit_csv",
      doc_token_count: documentMetrics.tokenEstimate,
      doc_char_count: documentMetrics.characterCount,
      scrub_count: documentMetrics.scrubCount,
      reading_time_seconds: Math.round(documentMetrics.readingDurationMinutes * 60),
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-spek-bg text-spek-text overflow-hidden select-none">
      {/* 1. TOP CONTROL BAR (38px height) */}
      <header className="h-[38px] min-h-[38px] bg-spek-panel border-b border-spek-border px-3 flex items-center justify-between text-xs font-mono z-30">
        {/* Left: Brand & Template Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-spek-border">
            <span className="w-2 h-2 rounded-full bg-spek-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="font-bold tracking-widest text-white text-sm">SPEK</span>
            <span className="text-[10px] text-spek-dim font-normal">v1.0</span>
          </div>

          {/* Quick Template Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTemplateMenu(!showTemplateMenu);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 bg-spek-elevated hover:bg-spek-subtle border border-spek-border rounded-sm text-spek-text transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-spek-blue" />
              <span className="font-medium text-[11px]">
                {TEMPLATES[selectedTemplateId]?.name || "Select Template"}
              </span>
              <ChevronDown className="w-3 h-3 text-spek-dim" />
            </button>

            {showTemplateMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-spek-elevated border border-spek-border shadow-2xl rounded-sm z-50 py-1">
                <div className="px-3 py-1 text-[10px] text-spek-dim uppercase tracking-wider border-b border-spek-border">
                  ARCHITECTURAL TEMPLATES
                </div>
                {Object.values(TEMPLATES).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-spek-subtle transition-colors text-xs ${
                      selectedTemplateId === tmpl.id ? "text-spek-emerald bg-spek-subtle/50" : "text-spek-text"
                    }`}
                  >
                    <span>{tmpl.name}</span>
                    <span className="text-[10px] text-spek-dim">{tmpl.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Secret Scrubber Live Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleScrubber}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono text-[11px] transition-all ${
              isScrubberEnabled
                ? "bg-red-950/40 border-red-700/60 text-red-300 hover:bg-red-900/50"
                : "bg-spek-elevated border-spek-border text-spek-dim hover:text-spek-text"
            }`}
            title="Toggle XRegExp Client-Side Compliance Scrubber"
          >
            {isScrubberEnabled ? (
              <ShieldAlert className="w-3.5 h-3.5 text-spek-red" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-spek-dim" />
            )}
            <span>SCRUBBER: {isScrubberEnabled ? "ACTIVE" : "BYPASSED"}</span>
            {isScrubberEnabled && scrubResult.matchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-900 text-red-200 text-[10px] font-bold rounded-sm">
                {scrubResult.matchCount}
              </span>
            )}
          </button>

          {scrubResult.matchCount > 0 && (
            <button
              onClick={() => setShowAuditDrawer(!showAuditDrawer)}
              className="text-[11px] text-spek-dim hover:text-white underline underline-offset-2"
            >
              View Audit
            </button>
          )}
        </div>

        {/* Right: View Switcher & Export Menu */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-spek-elevated border border-spek-border rounded-sm p-0.5">
            <button
              onClick={() => setViewMode("split")}
              className={`px-2 py-0.5 rounded-sm text-[11px] flex items-center gap-1 transition-colors ${
                viewMode === "split" ? "bg-spek-subtle text-white" : "text-spek-dim hover:text-spek-text"
              }`}
              title="Split View (Editor + Live Preview)"
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode("editor-only")}
              className={`px-2 py-0.5 rounded-sm text-[11px] flex items-center gap-1 transition-colors ${
                viewMode === "editor-only" ? "bg-spek-subtle text-white" : "text-spek-dim hover:text-spek-text"
              }`}
              title="Editor Fullscreen"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setViewMode("preview-only")}
              className={`px-2 py-0.5 rounded-sm text-[11px] flex items-center gap-1 transition-colors ${
                viewMode === "preview-only" ? "bg-spek-subtle text-white" : "text-spek-dim hover:text-spek-text"
              }`}
              title="Preview Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowTemplateMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-spek-blue/20 hover:bg-spek-blue/30 text-blue-400 border border-spek-blue/40 rounded-sm text-[11px] font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-60 bg-spek-elevated border border-spek-border shadow-2xl rounded-sm z-50 py-1 font-mono text-xs">
                <div className="px-3 py-1 text-[10px] text-spek-dim uppercase tracking-wider border-b border-spek-border">
                  EXPORT WORKBENCH SPEC
                </div>
                <button
                  onClick={handleExportHTML}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-spek-subtle text-spek-text hover:text-white"
                >
                  <FileCode className="w-3.5 h-3.5 text-spek-emerald" />
                  <div>
                    <div>Standalone HTML (.html)</div>
                    <div className="text-[10px] text-spek-dim">lit-html offline runnable bundle</div>
                  </div>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-spek-subtle text-spek-text hover:text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-spek-blue" />
                  <div>
                    <div>GFM Markdown (.md)</div>
                    <div className="text-[10px] text-spek-dim">Standard GitHub syntax</div>
                  </div>
                </button>
                <div className="border-t border-spek-border my-1" />
                <button
                  onClick={handleExportAuditJSON}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-spek-subtle text-spek-text hover:text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div>Audit Report (JSON)</div>
                    <div className="text-[10px] text-spek-dim">SOC2 & redaction telemetry</div>
                  </div>
                </button>
                <button
                  onClick={handleExportAuditCSV}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-spek-subtle text-spek-text hover:text-white"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div>Audit Log (CSV)</div>
                    <div className="text-[10px] text-spek-dim">Spreadsheet compliant</div>
                  </div>
                </button>
                <div className="border-t border-spek-border my-1" />
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    window.print();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-spek-subtle text-spek-text hover:text-white"
                >
                  <Printer className="w-3.5 h-3.5 text-spek-muted" />
                  <div>
                    <div>Print / PDF Export</div>
                    <div className="text-[10px] text-spek-dim">Print-optimized layout</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN DUAL-PANE WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: TABBED EDITORS (Markdown, Quill, DataGrid) */}
        {(viewMode === "split" || viewMode === "editor-only") && (
          <section
            className={`flex flex-col h-full border-r border-spek-border ${
              viewMode === "editor-only" ? "w-full" : "w-1/2"
            }`}
          >
            {/* Editor Tab Strip */}
            <div className="h-[32px] min-h-[32px] bg-spek-panel border-b border-spek-border px-2 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("markdown")}
                  className={`px-3 py-1 flex items-center gap-1.5 rounded-t-sm border-t border-l border-r text-xs transition-colors ${
                    activeTab === "markdown"
                      ? "bg-spek-elevated border-spek-border text-white font-medium"
                      : "border-transparent text-spek-dim hover:text-spek-text"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-spek-blue" />
                  <span>RAW MARKDOWN</span>
                </button>
                <button
                  onClick={() => setActiveTab("quill")}
                  className={`px-3 py-1 flex items-center gap-1.5 rounded-t-sm border-t border-l border-r text-xs transition-colors ${
                    activeTab === "quill"
                      ? "bg-spek-elevated border-spek-border text-white font-medium"
                      : "border-transparent text-spek-dim hover:text-spek-text"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-spek-emerald" />
                  <span>QUILL WYSIWYG</span>
                </button>
                <button
                  onClick={() => setActiveTab("datagrid")}
                  className={`px-3 py-1 flex items-center gap-1.5 rounded-t-sm border-t border-l border-r text-xs transition-colors ${
                    activeTab === "datagrid"
                      ? "bg-spek-elevated border-spek-border text-white font-medium"
                      : "border-transparent text-spek-dim hover:text-spek-text"
                  }`}
                >
                  <Table className="w-3.5 h-3.5 text-amber-400" />
                  <span>CSV / JSON GRID</span>
                </button>
              </div>

              <div className="text-[11px] text-spek-dim font-mono pr-2">
                {activeTab === "markdown" && "LOCKED 1:1 SYNC"}
                {activeTab === "quill" && "WYSIWYG CONTENT-EDITABLE"}
                {activeTab === "datagrid" && "TANSTACK DATA ENGINE"}
              </div>
            </div>

            {/* Active Editor Pane */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "markdown" && (
                <MarkdownEditor
                  value={rawMarkdown}
                  onChange={handleMarkdownChange}
                  onUndo={handleUndo}
                  canUndo={historyIndex > 0}
                />
              )}
              {activeTab === "quill" && (
                <QuillEditor initialHtml={quillHtml} onChange={handleQuillChange} />
              )}
              {activeTab === "datagrid" && (
                <DataGrid
                  onInjectMarkdown={handleInjectTable}
                  onInjectChart={handleInjectChart}
                />
              )}
            </div>
          </section>
        )}

        {/* RIGHT PANEL: COMPILED LIVE PREVIEW (KaTeX, D3, Redactions) */}
        {(viewMode === "split" || viewMode === "preview-only") && (
          <section className={`flex-1 h-full overflow-hidden flex flex-col`}>
            <PreviewPane
              markdown={activeDisplayMarkdown}
              isScrubbed={isScrubberEnabled}
              onToggleScrub={handleToggleScrubber}
              scrubCount={scrubResult.matchCount}
            />
          </section>
        )}
      </main>

      {/* 3. AUDIT TRAIL MODAL DRAWER */}
      {showAuditDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-spek-elevated border border-spek-border w-full max-w-3xl max-h-[80vh] flex flex-col rounded-sm shadow-2xl font-mono text-xs">
            <div className="px-4 py-2.5 bg-spek-panel border-b border-spek-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-spek-red" />
                <span className="font-bold text-white tracking-wider">
                  SECURITY & SECRET REDACTION AUDIT TRAIL
                </span>
                <span className="text-spek-dim">
                  ({scrubResult.matchCount} active redactions)
                </span>
              </div>
              <button
                onClick={() => setShowAuditDrawer(false)}
                className="text-spek-dim hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-spek-border text-spek-dim text-[11px]">
                    <th className="p-2">RULE NAME</th>
                    <th className="p-2">CATEGORY</th>
                    <th className="p-2">REDACTED PLACEHOLDER</th>
                    <th className="p-2">MASKED SAMPLE</th>
                    <th className="p-2">OFFSET</th>
                  </tr>
                </thead>
                <tbody>
                  {scrubResult.auditTrail.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-spek-border/50 hover:bg-spek-subtle"
                    >
                      <td className="p-2 text-white">{entry.ruleName}</td>
                      <td className="p-2 text-spek-dim uppercase">{entry.category}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded-sm text-[10px]">
                          {entry.placeholder}
                        </span>
                      </td>
                      <td className="p-2 text-spek-muted">{entry.maskedPreview}</td>
                      <td className="p-2 text-spek-dim">{entry.index}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-spek-panel border-t border-spek-border flex items-center justify-between text-[11px] text-spek-dim">
              <span>SOC2 Type-II Compliance Engine • Client-Side XRegExp</span>
              <button
                onClick={handleExportAuditCSV}
                className="px-2.5 py-1 bg-spek-subtle hover:bg-spek-border text-white border border-spek-border rounded-sm"
              >
                Download Audit CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOTTOM STATUS BAR (24px height) */}
      <footer className="h-[24px] min-h-[24px] bg-spek-panel border-t border-spek-border px-3 flex items-center justify-between text-[11px] font-mono z-30 select-none">
        {/* Offline Status & Telemetry Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-spek-dim">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-spek-emerald" />
                <span>ONLINE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE (PWA CACHED)</span>
              </span>
            )}
          </div>

          <span className="text-spek-border">|</span>

          <span className="text-spek-dim">
            CHARS: <strong className="text-spek-text">{documentMetrics.characterCount}</strong>
          </span>
          <span className="text-spek-dim">
            WORDS: <strong className="text-spek-text">{documentMetrics.wordCount}</strong>
          </span>
          <span className="text-spek-dim">
            TOKENS: <strong className="text-spek-text">~{documentMetrics.tokenEstimate}</strong>
          </span>
          <span className="text-spek-dim">
            READ: <strong className="text-spek-text">{documentMetrics.readingDurationMinutes}m</strong>
          </span>
          <span className="text-spek-dim">
            MATH: <strong className="text-spek-text">{documentMetrics.mathBlockCount}</strong>
          </span>
        </div>

        {/* Right side: Redactions & System Badge */}
        <div className="flex items-center gap-3">
          <span
            onClick={() => setShowAuditDrawer(true)}
            className="cursor-pointer hover:underline text-spek-dim"
          >
            SCRUBBED:{" "}
            <strong
              className={scrubResult.matchCount > 0 ? "text-red-400" : "text-spek-emerald"}
            >
              {scrubResult.matchCount} SECRETS
            </strong>
          </span>

          <span className="text-spek-border">|</span>

          <span className="text-spek-dim">
            HASH: <strong className="text-spek-text">{documentMetrics.documentHash}</strong>
          </span>

          <span className="text-spek-border">|</span>

          {/* Non-intrusive sponsor / architectural statement */}
          <span className="text-[10px] text-spek-dim">
            [SPEK v1.0 • ARCHITECTURE RUNBOOK WORKBENCH • ZERO CLOUD LEAKAGE]
          </span>
        </div>
      </footer>
    </div>
  );
}

