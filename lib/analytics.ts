import { ScrubAuditEntry, ScrubResult } from "./scrubber";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type AnalyticsEvent =
  | {
      event: "report_exported";
      export_format: "html" | "md" | "audit_json" | "audit_csv" | "pdf";
      doc_token_count: number;
      doc_char_count: number;
      scrub_count: number;
      reading_time_seconds: number;
    }
  | {
      event: "secrets_scrubbed";
      scrub_count: number;
      categories_affected: string[];
    }
  | {
      event: "table_imported";
      row_count: number;
      col_count: number;
      import_type: "csv" | "json";
    }
  | {
      event: "pwa_installed";
      outcome: "accepted" | "dismissed";
    }
  | {
      event: "template_loaded";
      template_name: string;
    }
  | {
      event: "view_mode_changed";
      mode: string;
    };

/**
 * Pushes structured telemetry events into GTM / GA4 dataLayer
 * Strictly enforces zero-PII/zero-content transmission
 */
export function trackEvent(payload: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...payload,
    timestamp: new Date().toISOString(),
    speik_version: "1.0.0",
    client_offline: !navigator.onLine,
  });
}

export interface DocumentMetrics {
  title: string;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  tokenEstimate: number;
  readingDurationMinutes: number;
  mathBlockCount: number;
  chartCount: number;
  tableDimensions: { rows: number; columns: number } | null;
  scrubCount: number;
  categoryRedactions: Record<string, number>;
  generatedAt: string;
  documentHash: string;
}

/**
 * Simple 32-bit FNV-1a non-cryptographic checksum for immutable document auditing
 */
function computeDocumentHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return "0x" + (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

/**
 * Computes deterministic document statistics, math counts, charts, and reading metrics
 */
export function calculateDocumentMetrics(
  text: string,
  scrubResult: ScrubResult,
  tableData?: { rows: number; columns: number } | null,
  title = "Untitled Technical Document"
): DocumentMetrics {
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  
  // Standard LLM heuristic: ~4 chars per token in technical English & code
  const tokenEstimate = Math.ceil(characters / 4);

  // Industry average reading speed for technical specifications: 180-200 WPM
  const readingDurationMinutes = +(words / 190).toFixed(2);

  // Math equation occurrences ($...$ or $$...$$)
  const mathInlineMatches = (text.match(/(?<!\\)\$[^$\n]+\$/g) || []).length;
  const mathDisplayMatches = (text.match(/(?<!\\)\$\$[\s\S]+?\$\$/g) || []).length;
  const mathBlockCount = mathInlineMatches + mathDisplayMatches;

  // Chart blocks (```chart or ```d3)
  const chartMatches = (text.match(/```(?:chart|d3)/g) || []).length;

  return {
    title,
    characterCount: characters,
    wordCount: words,
    lineCount: lines,
    tokenEstimate,
    readingDurationMinutes,
    mathBlockCount,
    chartCount: chartMatches,
    tableDimensions: tableData || null,
    scrubCount: scrubResult.matchCount,
    categoryRedactions: scrubResult.categoryCounts,
    generatedAt: new Date().toISOString(),
    documentHash: computeDocumentHash(text),
  };
}

/**
 * Compiles a structured JSON document audit report
 */
export function compileDocumentAuditJSON(
  metrics: DocumentMetrics,
  auditTrail: ScrubAuditEntry[]
): string {
  const auditReport = {
    speik_audit_version: "1.0.0",
    compliance_standard: "SOC2-TypeII-Offline-Scrubber",
    exported_at: new Date().toISOString(),
    document: {
      title: metrics.title,
      checksum_fnv1a: metrics.documentHash,
      statistics: {
        character_count: metrics.characterCount,
        word_count: metrics.wordCount,
        line_count: metrics.lineCount,
        token_estimate: metrics.tokenEstimate,
        reading_duration_minutes: metrics.readingDurationMinutes,
        math_equations_count: metrics.mathBlockCount,
        charts_rendered_count: metrics.chartCount,
        table_grid: metrics.tableDimensions,
      },
    },
    scrubber_summary: {
      total_secrets_redacted: metrics.scrubCount,
      categories_breakdown: metrics.categoryRedactions,
      audit_events: auditTrail,
    },
  };

  return JSON.stringify(auditReport, null, 2);
}

/**
 * Compiles an RFC-4180 CSV telemetry & audit summary
 */
export function compileDocumentAuditCSV(
  metrics: DocumentMetrics,
  auditTrail: ScrubAuditEntry[]
): string {
  const metaLines = [
    `# SPEIK AUDIT TELEMETRY EXPORT - ${metrics.generatedAt}`,
    `# DOCUMENT TITLE: "${metrics.title}"`,
    `# DOCUMENT HASH: ${metrics.documentHash}`,
    `# CHARS: ${metrics.characterCount} | WORDS: ${metrics.wordCount} | TOKENS: ${metrics.tokenEstimate} | READING TIME: ${metrics.readingDurationMinutes}m`,
    `# SECRETS REDACTED: ${metrics.scrubCount}`,
    "",
    "event_id,rule_id,rule_name,category,placeholder,masked_preview,timestamp,byte_offset",
  ];

  const dataLines = auditTrail.map((entry) =>
    [
      `"${entry.id}"`,
      `"${entry.ruleId}"`,
      `"${entry.ruleName}"`,
      `"${entry.category}"`,
      `"${entry.placeholder}"`,
      `"${entry.maskedPreview}"`,
      `"${entry.timestamp}"`,
      entry.index,
    ].join(",")
  );

  return [...metaLines, ...dataLines].join("\r\n");
}

