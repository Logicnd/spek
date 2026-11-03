import XRegExp from "xregexp";

export interface ScrubRule {
  id: string;
  name: string;
  category: "credentials" | "network" | "pii" | "database";
  regex: RegExp;
  placeholder: string;
  description: string;
}

export interface ScrubAuditEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  category: string;
  placeholder: string;
  maskedPreview: string;
  timestamp: string;
  index: number;
}

export interface ScrubResult {
  scrubbedText: string;
  matchCount: number;
  auditTrail: ScrubAuditEntry[];
  categoryCounts: Record<string, number>;
}

// Named capture patterns compiled via XRegExp
export const SCRUB_RULES: ScrubRule[] = [
  {
    id: "aws_access_key",
    name: "AWS Access Key ID",
    category: "credentials",
    regex: XRegExp("(?<aws_key>\\b(AKIA|ASIA|AROA)[0-9A-Z]{16}\\b)", "g"),
    placeholder: "[REDACTED_AWS_KEY]",
    description: "AWS 20-character Access Key identifier",
  },
  {
    id: "stripe_key",
    name: "Stripe API Key",
    category: "credentials",
    regex: XRegExp("(?<stripe_key>\\b(?:sk|pk|rk)_(?:test|live)_[0-9a-zA-Z]{24,99}\\b)", "g"),
    placeholder: "[REDACTED_STRIPE_KEY]",
    description: "Stripe secret, publishable, or restricted API key",
  },
  {
    id: "jwt_token",
    name: "JSON Web Token (JWT)",
    category: "credentials",
    regex: XRegExp("(?<jwt>\\beyJ[a-zA-Z0-9_-]{10,}\\.eyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}\\b)", "g"),
    placeholder: "[REDACTED_JWT]",
    description: "Three-segment Base64URL signed JWT token",
  },
  {
    id: "bearer_token",
    name: "Authorization Bearer Token",
    category: "credentials",
    regex: XRegExp("(?<bearer>\\bBearer\\s+[A-Za-z0-9._\\-]{24,}\\b)", "gi"),
    placeholder: "Bearer [REDACTED_BEARER_TOKEN]",
    description: "HTTP Authorization Bearer token header",
  },
  {
    id: "db_connection",
    name: "Database Connection String with Credentials",
    category: "database",
    regex: XRegExp("(?<db>\\b(?:postgres(?:ql)?|mysql|mongodb(?:\\+srv)?|redis):\\/\\/[^\\s:@]+:[^\\s:@]+@[^\\s/:]+(?::\\d+)?(?:\\/[^\\s]*)?\\b)", "gi"),
    placeholder: "[REDACTED_DB_CONNECTION]",
    description: "URI containing database username and password",
  },
  {
    id: "ipv4_address",
    name: "IPv4 Address",
    category: "network",
    regex: XRegExp("(?<ipv4>\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b)", "g"),
    placeholder: "[REDACTED_IP]",
    description: "Dotted quad IPv4 public or private address",
  },
  {
    id: "ipv6_address",
    name: "IPv6 Address",
    category: "network",
    regex: XRegExp("(?<ipv6>\\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\b)", "gi"),
    placeholder: "[REDACTED_IPV6]",
    description: "Standard 8-group hexadecimal IPv6 network address",
  },
  {
    id: "mac_address",
    name: "Hardware MAC Address",
    category: "network",
    regex: XRegExp("(?<mac>\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b)", "g"),
    placeholder: "[REDACTED_MAC]",
    description: "IEEE 802 Media Access Control hardware identifier",
  },
  {
    id: "corporate_email",
    name: "Corporate Email Address",
    category: "pii",
    regex: XRegExp("(?<email>\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b)", "gi"),
    placeholder: "[REDACTED_EMAIL]",
    description: "Personally identifiable enterprise email address",
  },
];

/**
 * Creates a safe, non-revealing preview of a matched secret
 * e.g. "AKIA...9F2A" or "u***r@domain.com"
 */
export function maskSensitiveValue(value: string, ruleId: string): string {
  if (!value) return "********";
  if (ruleId === "corporate_email") {
    const parts = value.split("@");
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : "***";
      return `${maskedName}@${domain}`;
    }
  }
  if (ruleId === "ipv4_address" || ruleId === "ipv6_address" || ruleId === "mac_address") {
    return `${value.slice(0, 3)}...${value.slice(-2)}`;
  }
  if (value.length <= 8) {
    return "********";
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * Scans document text, applies XRegExp named captures, and returns sanitized text with audit trail
 */
export function scrubDocument(
  rawText: string,
  enabledRuleIds?: string[]
): ScrubResult {
  if (!rawText) {
    return {
      scrubbedText: "",
      matchCount: 0,
      auditTrail: [],
      categoryCounts: {},
    };
  }

  const activeRules = enabledRuleIds
    ? SCRUB_RULES.filter((r) => enabledRuleIds.includes(r.id))
    : SCRUB_RULES;

  let currentText = rawText;
  const auditTrail: ScrubAuditEntry[] = [];
  const categoryCounts: Record<string, number> = {
    credentials: 0,
    network: 0,
    pii: 0,
    database: 0,
  };

  const now = new Date().toISOString();

  // Process rules sequentially to create precise audit trails and replacements
  for (const rule of activeRules) {
    // Collect all matches first
    const matches: { value: string; index: number }[] = [];
    XRegExp.forEach(currentText, rule.regex, (match) => {
      matches.push({
        value: match[0],
        index: match.index ?? 0,
      });
    });

    if (matches.length > 0) {
      matches.forEach((m, idx) => {
        auditTrail.push({
          id: `${rule.id}-${auditTrail.length + 1}`,
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          placeholder: rule.placeholder,
          maskedPreview: maskSensitiveValue(m.value, rule.id),
          timestamp: now,
          index: m.index,
        });

        categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
      });

      // Replace using XRegExp replace with clean placeholder
      currentText = XRegExp.replace(currentText, rule.regex, rule.placeholder);
    }
  }

  return {
    scrubbedText: currentText,
    matchCount: auditTrail.length,
    auditTrail,
    categoryCounts,
  };
}

/**
 * Formats the audit trail into an RFC 4180 compliant CSV string
 */
export function formatAuditTrailCSV(auditTrail: ScrubAuditEntry[]): string {
  const header = ["ID", "Rule ID", "Rule Name", "Category", "Placeholder", "Masked Preview", "Timestamp", "Offset"];
  const rows = auditTrail.map((entry) => [
    `"${entry.id}"`,
    `"${entry.ruleId}"`,
    `"${entry.ruleName}"`,
    `"${entry.category}"`,
    `"${entry.placeholder}"`,
    `"${entry.maskedPreview}"`,
    `"${entry.timestamp}"`,
    entry.index.toString(),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
