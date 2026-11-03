"use client";

import React, { useState } from "react";
import {
  X,
  Briefcase,
  Terminal,
  Cpu,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: "business" | "devops" | "architect" | "student") => void;
}

export const HelpDrawer: React.FC<HelpDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const [activeTab, setActiveTab] = useState<"business" | "devops" | "architect" | "student">("business");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-spek-panel border-l border-spek-border h-full flex flex-col font-mono text-xs text-spek-text shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-spek-elevated border-b border-spek-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-spek-emerald" />
            <span className="font-bold text-white tracking-wider text-sm">
              SPEK FIELD MANUAL // ROLE ADAPTOR
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-spek-subtle rounded-sm text-spek-dim hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex border-b border-spek-border bg-spek-bg">
          <button
            onClick={() => setActiveTab("business")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 text-xs transition-colors ${
              activeTab === "business"
                ? "border-spek-emerald text-white bg-spek-panel font-medium"
                : "border-transparent text-spek-dim hover:text-spek-muted"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-spek-emerald" />
            <span>Business & Execs</span>
          </button>
          <button
            onClick={() => setActiveTab("devops")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 text-xs transition-colors ${
              activeTab === "devops"
                ? "border-spek-blue text-white bg-spek-panel font-medium"
                : "border-transparent text-spek-dim hover:text-spek-muted"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>IT & DevOps</span>
          </button>
          <button
            onClick={() => setActiveTab("architect")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 text-xs transition-colors ${
              activeTab === "architect"
                ? "border-purple-400 text-white bg-spek-panel font-medium"
                : "border-transparent text-spek-dim hover:text-spek-muted"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Architects</span>
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 text-xs transition-colors ${
              activeTab === "student"
                ? "border-amber-400 text-white bg-spek-panel font-medium"
                : "border-transparent text-spek-dim hover:text-spek-muted"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>Learners & Newbies</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* BUSINESS / EXECUTIVE ROLE */}
          {activeTab === "business" && (
            <div className="space-y-4">
              <div className="p-3 bg-spek-elevated border border-spek-border rounded-sm">
                <div className="font-semibold text-white text-sm mb-1 flex items-center justify-between">
                  <span>How to use Spek for Business & Leadership</span>
                  <button
                    onClick={() => {
                      onSelectRole("business");
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-spek-emerald/20 hover:bg-spek-emerald/30 text-emerald-400 border border-spek-emerald/40 rounded-sm text-[11px]"
                  >
                    <span>Activate Business View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-spek-muted leading-relaxed text-xs">
                  You don’t need to know code or math symbols. Use Spek to draft clean SLA reports, audit service uptime against contracts, monitor infrastructure spending, and export boardroom-ready PDFs.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-spek-dim">
                  RECOMMENDED WORKFLOW FOR MANAGERS
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-spek-subtle flex items-center justify-center text-spek-emerald font-bold shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Use the "QUILL WYSIWYG" Tab</strong>
                      <p className="text-spek-dim mt-0.5">
                        Works just like Microsoft Word or Google Docs. Bold, headings, lists, and tables without editing raw markdown syntax.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-spek-subtle flex items-center justify-center text-spek-emerald font-bold shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Pick the "SLA & Performance Report" Template</strong>
                      <p className="text-spek-dim mt-0.5">
                        Pre-filled with 99.99% availability calculations, monthly permissible downtime limits (4.32 min/mo), and tier breakdowns.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-spek-subtle flex items-center justify-center text-spek-emerald font-bold shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      <strong className="text-white">One-Click PDF / Standalone HTML Export</strong>
                      <p className="text-spek-dim mt-0.5">
                        Click <strong>Export → Print / PDF</strong> to get a print-optimized document with zero clutter, or <strong>Standalone HTML</strong> for an offline email attachment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IT & DEVOPS ROLE */}
          {activeTab === "devops" && (
            <div className="space-y-4">
              <div className="p-3 bg-spek-elevated border border-spek-border rounded-sm">
                <div className="font-semibold text-white text-sm mb-1 flex items-center justify-between">
                  <span>How to use Spek for IT & DevOps</span>
                  <button
                    onClick={() => {
                      onSelectRole("devops");
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-spek-blue/20 hover:bg-spek-blue/30 text-blue-400 border border-spek-blue/40 rounded-sm text-[11px]"
                  >
                    <span>Activate DevOps View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-spek-muted leading-relaxed text-xs">
                  Execute incident response triage with zero risk of accidentally pasting production secrets or private cluster IPs into post-mortems and shared channels.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-spek-dim">
                  CORE DEVOPS CAPABILITIES
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <div className="flex items-center justify-between text-white font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-spek-red" />
                        Automated Compliance & Secret Scrubber
                      </span>
                      <span className="text-[10px] text-spek-dim">XRegExp Engine</span>
                    </div>
                    <p className="text-spek-dim">
                      Paste terminal logs containing AWS keys (<code className="text-red-300">AKIA...</code>), internal IPs (<code className="text-red-300">10.x.x.x</code>, <code className="text-red-300">192.168.x.x</code>), database URIs, or bearer tokens. Spek redacts them client-side in realtime before export.
                    </p>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <div className="text-white font-medium mb-1">
                      P99 & Latency Distribution Fences
                    </div>
                    <p className="text-spek-dim mb-2">
                      Drop simple CSV blocks into markdown to render live D3 bar charts with automated mean reference lines:
                    </p>
                    <div className="bg-spek-panel p-2 rounded-sm border border-spek-border text-[11px] relative">
                      <pre>
{`\`\`\`chart-bar
Service,P99_ms
auth-service,120.4
billing-api,245.0
inventory-db,320.4
\`\`\``}
                      </pre>
                      <button
                        onClick={() => handleCopy("```chart-bar\nService,P99_ms\nauth-service,120.4\nbilling-api,245.0\ninventory-db,320.4\n```", "chart-bar")}
                        className="absolute top-2 right-2 p-1 bg-spek-subtle hover:bg-spek-border text-spek-muted rounded-sm"
                      >
                        {copiedSnippet === "chart-bar" ? <Check className="w-3 h-3 text-spek-emerald" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARCHITECTS ROLE */}
          {activeTab === "architect" && (
            <div className="space-y-4">
              <div className="p-3 bg-spek-elevated border border-spek-border rounded-sm">
                <div className="font-semibold text-white text-sm mb-1 flex items-center justify-between">
                  <span>How to use Spek for Systems Architecture</span>
                  <button
                    onClick={() => {
                      onSelectRole("architect");
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-sm text-[11px]"
                  >
                    <span>Activate Architect View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-spek-muted leading-relaxed text-xs">
                  Author formal Request For Comments (RFC) specifications and Architectural Decision Records (ADR) with rigorous mathematical notation and network models.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-spek-dim">
                  MATHEMATICAL & ALGORITHMIC FORMULAS (KaTeX)
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <p className="text-spek-dim mb-2">
                      Inline math using <code className="text-white">$...$</code> or display blocks using <code className="text-white">$$...$$</code>:
                    </p>
                    <div className="bg-spek-panel p-2 rounded-sm border border-spek-border text-[11px] relative">
                      <pre>
{`$$
T_{\\text{handshake}} = 2 \\cdot RTT_{\\max} + \\mathcal{O}(\\log N)
$$`}
                      </pre>
                      <button
                        onClick={() => handleCopy("$$\nT_{\\text{handshake}} = 2 \\cdot RTT_{\\max} + \\mathcal{O}(\\log N)\n$$", "katex-eq")}
                        className="absolute top-2 right-2 p-1 bg-spek-subtle hover:bg-spek-border text-spek-muted rounded-sm"
                      >
                        {copiedSnippet === "katex-eq" ? <Check className="w-3 h-3 text-spek-emerald" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <strong className="text-white">Single-File Self-Contained Deliverable</strong>
                    <p className="text-spek-dim mt-0.5">
                      Export your entire RFC as a standalone offline HTML bundle via <strong>Export → Standalone HTML</strong>. It includes embedded styles, charts, and math rendering so reviewers don't need internet or external dependencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS / NEWBIES ROLE */}
          {activeTab === "student" && (
            <div className="space-y-4">
              <div className="p-3 bg-spek-elevated border border-spek-border rounded-sm">
                <div className="font-semibold text-white text-sm mb-1 flex items-center justify-between">
                  <span>How to use Spek if You're New or Learning</span>
                  <button
                    onClick={() => {
                      onSelectRole("student");
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-sm text-[11px]"
                  >
                    <span>Activate Starter View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-spek-muted leading-relaxed text-xs">
                  Welcome! Technical documentation tools can look intimidating at first with code syntax and formulas. Here is the friendly quick-reference.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-spek-dim">
                  NO-STRESS CHEAT SHEET
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <div className="text-white font-medium mb-1">Want to make tables easily?</div>
                    <p className="text-spek-dim">
                      Don’t write markdown pipes by hand. Click the <strong>CSV / JSON GRID</strong> tab at the top of the left pane, paste your spreadsheet data, and click <strong>"Inject Table"</strong>!
                    </p>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <div className="text-white font-medium mb-1">Want visual formatting?</div>
                    <p className="text-spek-dim">
                      Click the <strong>QUILL WYSIWYG</strong> tab. You can highlight text, click <strong>B</strong> for Bold, choose Heading 1 or Heading 2, and create bullet points just like any word processor.
                    </p>
                  </div>

                  <div className="p-2.5 bg-spek-bg border border-spek-border rounded-sm">
                    <div className="text-white font-medium mb-1">What does the Secret Scrubber do?</div>
                    <p className="text-spek-dim">
                      If you type an IP address (like <code className="text-white">192.168.1.1</code>) or an email address, Spek safely shields it as <code className="text-red-300">[REDACTED_IP]</code> so you never accidentally expose private information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Universal Keyboard Shortcuts */}
          <div className="pt-2 border-t border-spek-border">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-spek-dim mb-2">
              KEYBOARD SHORTCUTS
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-spek-bg border border-spek-border rounded-sm flex items-center justify-between">
                <span className="text-spek-dim">Print / PDF</span>
                <kbd className="px-1.5 py-0.5 bg-spek-subtle border border-spek-border text-[10px] text-white rounded">
                  Ctrl / ⌘ + P
                </kbd>
              </div>
              <div className="p-2 bg-spek-bg border border-spek-border rounded-sm flex items-center justify-between">
                <span className="text-spek-dim">Undo Edit</span>
                <kbd className="px-1.5 py-0.5 bg-spek-subtle border border-spek-border text-[10px] text-white rounded">
                  Ctrl / ⌘ + Z
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-spek-elevated border-t border-spek-border flex items-center justify-between text-spek-dim text-[11px]">
          <span>Spek Technical Runbook Engine • 100% Offline Runnable</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-spek-subtle hover:bg-spek-border text-white border border-spek-border rounded-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
