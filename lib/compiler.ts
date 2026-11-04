import { html, render } from "lit-html";
import { DocumentMetrics } from "./analytics";
import { ScrubAuditEntry } from "./scrubber";

export interface StandaloneReportOptions {
  title: string;
  compiledContentHtml: string;
  rawMarkdown: string;
  metrics: DocumentMetrics;
  auditTrail: ScrubAuditEntry[];
  scrubbed: boolean;
}

/**
 * Standard KaTeX layout CSS rules required for offline math formula alignment
 */
const KATEX_INLINE_CSS = `
.katex { font: normal 1.1em KaTeX_Main, Times New Roman, serif; line-height: 1.2; text-indent: 0; text-rendering: auto; }
.katex * { -ms-high-contrast-adjust: none !important; }
.katex .katex-html { display: inline-block; }
.katex-display { display: block; margin: 1em 0; text-align: center; overflow-x: auto; overflow-y: hidden; padding: 0.5rem 0; }
.katex-display > .katex { display: block; text-align: center; white-space: nowrap; }
.katex-display > .katex > .katex-html { display: block; position: relative; }
.katex .base { position: relative; display: inline-block; white-space: nowrap; width: min-content; }
.katex .strut { display: inline-block; height: 1em; }
.katex .mord, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct, .katex .minner { position: relative; }
.katex .mbin { margin-left: 0.2222em; margin-right: 0.2222em; }
.katex .mrel { margin-left: 0.2778em; margin-right: 0.2778em; }
.katex .mopen, .katex .mclose { margin-left: 0; margin-right: 0; }
.katex .vlist-t { display: inline-table; table-layout: fixed; border-collapse: collapse; }
.katex .vlist-r { display: table-row; }
.katex .vlist { display: table-cell; vertical-align: bottom; position: relative; }
.katex .frac-line { width: 100%; display: block; border-bottom-width: 0.04em; border-bottom-style: solid; }
.katex .sqrt > .root { margin-left: 0.2778em; margin-right: -0.5556em; }
`;

/**
 * High-density industrial styling embedded directly in the standalone HTML report
 */
const INDUSTRIAL_STYLES = `
:root {
  --bg-root: #0a0a0a;
  --bg-panel: #121212;
  --bg-elevated: #181818;
  --bg-subtle: #1e1e1e;
  --border: #262626;
  --border-light: #333333;
  --text: #e5e5e5;
  --text-muted: #a3a3a3;
  --text-dim: #737373;
  --emerald: #10b981;
  --blue: #3b82f6;
  --red: #ef4444;
  --font-mono: ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg-root);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Header & Utility Bar */
.spek-topbar {
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  padding: 0 1.25rem;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-badge {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--emerald);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.doc-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.meta-pill {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 2px;
  color: var(--text-muted);
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-subtle);
  border-color: var(--border-light);
  color: #ffffff;
}

/* Main Document Shell */
.spek-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem;
}

.spek-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.doc-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.doc-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  border-radius: 2px;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-top: 2px;
}

/* Document Typography */
.spek-content h1, .spek-content h2, .spek-content h3, .spek-content h4 {
  color: #ffffff;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}

.spek-content h1 { font-size: 20px; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
.spek-content h2 { font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
.spek-content h3 { font-size: 14px; }

.spek-content p {
  margin-bottom: 1rem;
  color: var(--text);
}

.spek-content a {
  color: var(--blue);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.spek-content ul, .spek-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.spek-content li {
  margin-bottom: 0.25rem;
}

.spek-content blockquote {
  border-left: 2px solid var(--blue);
  background: rgba(59, 130, 246, 0.05);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: var(--text-muted);
}

/* Monospace Code & Pre */
.spek-content code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  padding: 1px 4px;
  border-radius: 2px;
  color: #f3f4f6;
}

.spek-content pre {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  padding: 1rem;
  border-radius: 2px;
  overflow-x: auto;
  margin: 1.25rem 0;
}

.spek-content pre code {
  background: transparent;
  border: none;
  padding: 0;
}

/* Tables */
.spek-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-family: var(--font-mono);
  font-size: 12px;
}

.spek-content th {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
  color: #ffffff;
  font-weight: 600;
}

.spek-content td {
  border: 1px solid var(--border);
  padding: 6px 12px;
  color: var(--text);
}

.spek-content tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.015);
}

/* Redaction Badges */
.redacted-token {
  font-family: var(--font-mono);
  font-size: 11px;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: 600;
  display: inline-block;
}

/* Audit Section */
.audit-section {
  margin-top: 3.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border);
}

.audit-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

/* Print Optimization */
@media print {
  body {
    background-color: #ffffff !important;
    color: #111827 !important;
  }
  .spek-topbar, .action-btn {
    display: none !important;
  }
  .spek-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
  .spek-content code, .spek-content pre, .stat-card, .spek-content th, .spek-content td {
    border-color: #d1d5db !important;
    background: #f9fafb !important;
    color: #111827 !important;
  }
  .doc-title { color: #000000 !important; }
  .redacted-token {
    background: #fee2e2 !important;
    color: #991b1b !important;
    border-color: #f87171 !important;
  }
}
`;

/**
 * Generates an offline-runnable, self-contained standalone HTML report string
 * utilizing lit-html templating
 */
export function generateStandaloneReport(options: StandaloneReportOptions): string {
  const { title, compiledContentHtml, rawMarkdown, metrics, auditTrail } = options;

  // Render template to string using lit-html template container
  const rawMarkdownEscaped = encodeURIComponent(rawMarkdown);

  const reportTemplate = html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} — Speik Standalone Report</title>
        <style>
          ${INDUSTRIAL_STYLES}
          ${KATEX_INLINE_CSS}
        </style>
      </head>
      <body>
        <div class="spek-topbar">
          <div class="brand-group">
            <span class="brand-badge">
              <span class="status-dot"></span>
              SPEIK // ARCHIVE
            </span>
            <div class="doc-meta">
              <span class="meta-pill">HASH: ${metrics.documentHash}</span>
              <span class="meta-pill">OFFLINE RUNNABLE</span>
            </div>
          </div>
          <div class="btn-group">
            <button class="action-btn" onclick="window.print()">Print / PDF</button>
            <button class="action-btn" id="copyRawBtn">Copy Markdown</button>
          </div>
        </div>

        <main class="spek-container">
          <header class="spek-header">
            <h1 class="doc-title">${title}</h1>
            <div class="doc-stats-grid">
              <div class="stat-card">
                <div class="stat-label">Word Count</div>
                <div class="stat-value">${metrics.wordCount} words</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Token Estimate</div>
                <div class="stat-value">~${metrics.tokenEstimate} tokens</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Reading Time</div>
                <div class="stat-value">${metrics.readingDurationMinutes} min</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Redactions</div>
                <div class="stat-value">${metrics.scrubCount} items</div>
              </div>
            </div>
          </header>

          <article class="spek-content" id="spek-content-body">
            <!-- INJECT_CONTENT_HTML -->
          </article>

          ${auditTrail.length > 0
            ? html`
                <footer class="audit-section">
                  <div class="audit-title">Security & Secret Redaction Audit Trail (${auditTrail.length})</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Rule ID</th>
                        <th>Classification</th>
                        <th>Placeholder</th>
                        <th>Masked Sample</th>
                        <th>Offset</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${auditTrail.map(
                        (a) => html`
                          <tr>
                            <td><code>${a.ruleId}</code></td>
                            <td>${a.category}</td>
                            <td><span class="redacted-token">${a.placeholder}</span></td>
                            <td><code>${a.maskedPreview}</code></td>
                            <td>${a.index}</td>
                          </tr>
                        `
                      )}
                    </tbody>
                  </table>
                </footer>
              `
            : ""}
        </main>

        <script>
          (function() {
            var raw = decodeURIComponent("${rawMarkdownEscaped}");
            var btn = document.getElementById("copyRawBtn");
            if (btn) {
              btn.addEventListener("click", function() {
                navigator.clipboard.writeText(raw).then(function() {
                  btn.textContent = "Copied!";
                  setTimeout(function() { btn.textContent = "Copy Markdown"; }, 2000);
                });
              });
            }
          })();
        </script>
      </body>
    </html>
  `;

  // Safely compile using a detached DOM container or lit-html evaluation
  let fullOutput = "";

  if (typeof document !== "undefined") {
    const dummy = document.createElement("div");
    render(reportTemplate, dummy);
    fullOutput = dummy.innerHTML;
  } else {
    // Fallback template serialization
    fullOutput = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${title} — Speik Standalone Report</title><style>${INDUSTRIAL_STYLES}${KATEX_INLINE_CSS}</style></head><body><div class="spek-topbar"><div class="brand-group"><span class="brand-badge"><span class="status-dot"></span>SPEIK // ARCHIVE</span><div class="doc-meta"><span class="meta-pill">HASH: ${metrics.documentHash}</span><span class="meta-pill">OFFLINE RUNNABLE</span></div></div><div class="btn-group"><button class="action-btn" onclick="window.print()">Print / PDF</button><button class="action-btn" id="copyRawBtn">Copy Markdown</button></div></div><main class="spek-container"><header class="spek-header"><h1 class="doc-title">${title}</h1><div class="doc-stats-grid"><div class="stat-card"><div class="stat-label">Word Count</div><div class="stat-value">${metrics.wordCount} words</div></div><div class="stat-card"><div class="stat-label">Token Estimate</div><div class="stat-value">~${metrics.tokenEstimate} tokens</div></div><div class="stat-card"><div class="stat-label">Reading Time</div><div class="stat-value">${metrics.readingDurationMinutes} min</div></div><div class="stat-card"><div class="stat-label">Redactions</div><div class="stat-value">${metrics.scrubCount} items</div></div></div></header><article class="spek-content" id="spek-content-body"><!-- INJECT_CONTENT_HTML --></article></main><script>(function(){var raw=decodeURIComponent("${rawMarkdownEscaped}");var btn=document.getElementById("copyRawBtn");if(btn){btn.addEventListener("click",function(){navigator.clipboard.writeText(raw).then(function(){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy Markdown";},2000);});});}})();</script></body></html>`;
  }

  // Inject the pre-rendered HTML content into the document placeholder
  return fullOutput.replace("<!-- INJECT_CONTENT_HTML -->", compiledContentHtml);
}

