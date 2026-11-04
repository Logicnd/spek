export interface TemplateSpec {
  id: string;
  name: string;
  category: string;
  targetRole: string;
  summary: string;
  recommendedTab: "markdown" | "quill" | "datagrid";
  markdown: string;
}

export const TEMPLATES: Record<string, TemplateSpec> = {
  incident: {
    id: "incident",
    name: "Incident Runbook",
    category: "DevOps & IT",
    targetRole: "Sysadmins, DevOps & Support Leads",
    summary: "Production emergency guide with diagnostic curl commands, failover protocols, and P99 latency bar charts.",
    recommendedTab: "markdown",
    markdown: `# INC-2026-9042: Edge Gateway P99 Latency Spike & Failover Runbook

> **INCIDENT METADATA**
> - **Severity**: SEV-1 (Production Critical)
> - **Incident Commander**: Lead SRE On-Call (incident-commander@corp.internal)
> - **Affected Systems**: \`ingress-router\`, \`auth-proxy\`, \`billing-api\`
> - **Target MTTR**: < 30 minutes

---

## 1. Executive Summary & Impact Radius
At 14:22 UTC, synthetic probes detected a sudden degradation in Edge Gateway response times. The 99th percentile latency breached the 250ms threshold, peaking at 420ms across EU and US clusters.

\`\`\`chart-bar
Service,P99_ms
auth-proxy,180.2
billing-api,310.8
order-sync,420.0
inventory-db,290.4
cache-redis,18.4
\`\`\`

---

## 2. Mathematical SLA & Availability Assessment
Service Level Availability is governed by mean time between failures ($MTBF$) and mean time to repair ($MTTR$):

$$A = \\frac{MTBF}{MTBF + MTTR} \\times 100\\%$$

For high-throughput ingress nodes, the empirical 99th percentile tail latency is modeled as:

$$L_{p99} = \\mu + 2.326 \\cdot \\sigma$$

Given baseline variance $\\sigma = 48\\text{ms}$ and drift mean $\\mu = 192\\text{ms}$, expected threshold limit is $303.6\\text{ms}$.

---

## 3. Redacted Telemetry & Diagnostic Traces
*(The compliance scrubber automatically sanitizes internal credentials and private network addresses below)*

- Ingress Pod Node: \`192.168.1.104\`
- Cluster Internal IP: \`10.244.0.15\`
- Database URI: \`postgres://db_admin:P@ssw0rd99!@db-prod.internal.corp:5432/orders\`
- AWS Deployment Role: \`AKIAIOSFODNN7EXAMPLE\`
- Primary SRE Contact: \`incident-response@speik.systems\`
- Bearer Auth Probe: \`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\`

---

## 4. Triage & Remediation Workflow

| Step | Action Item | Verification Command | Responsible |
|---|---|---|---|
| 01 | Drain Traffic from degraded node | \`kubectl drain node-eu-west-04 --ignore-daemonsets\` | SRE Primary |
| 02 | Flush Ingress Route Cache | \`redis-cli -h 10.244.0.15 -p 6379 FLUSHDB\` | Cache Team |
| 03 | Restart Proxy Deployments | \`kubectl rollout restart deployment/ingress-router\` | SRE Primary |
| 04 | Verify P99 Latency Recovery | \`curl -s -w "%{time_total}\\n" -o /dev/null https://api.internal/health\` | QA Lead |

---

## 5. Rollback Protocol
If latency does not normalize within 10 minutes post-drain:
1. Re-route DNS traffic to cold-standby cluster via BGP anycast.
2. Freeze all non-essential worker pipelines.
3. Open War Room bridge on primary incident channel.`,
  },

  rfc: {
    id: "rfc",
    name: "Architecture RFC",
    category: "Systems Architecture",
    targetRole: "Principal Engineers & Tech Leads",
    summary: "Request for Comments specification detailing mutual TLS security, consensus latency models, and Architectural Decision Records (ADR).",
    recommendedTab: "markdown",
    markdown: `# RFC-089: Zero-Trust Global Mesh & Distributed Ingress Architecture

- **Author**: Platform Architecture Working Group (architect@corp.internal)
- **Status**: Under Review
- **Supersedes**: RFC-042 (Legacy VPN Concentrator)

---

## 1. Problem Statement & Context
Current microservices communicate via flat private subnets with perimeter firewalls. As the service topology expands to multi-region cloud providers, identity verification must occur at every hop without transmitting unencrypted network payloads or shared secrets.

\`\`\`chart-line
NodeCount,Latency_ms
10,14.2
25,18.6
50,24.1
100,32.8
250,56.4
500,94.2
\`\`\`

---

## 2. Cryptographic Protocol & Computational Complexity
Mutual TLS handshake overhead scales linearly with round-trip latency and node verification depth:

$$T_{\\text{handshake}} = 2 \\cdot RTT_{\\max} + \\mathcal{O}(\\log N)$$

Message authentication codes are derived using HMAC-SHA256 with ephemeral token rotation:

$$H(M) = \\text{HMAC-SHA256}(K_{\\text{session}}, M \\parallel \\text{nonce})$$

The overall verification budget per packet must satisfy:

$$T_{\\text{verify}} \\le 0.450\\text{ms}$$

---

## 3. Compliance & Secret Verification Sandbox
*(Validate that secrets are scrubbed before publishing this RFC externally)*

- AWS KMS Access Key: \`AKIAI44QH8DHBEXAMPLE\`
- Gateway Ingress MAC: \`00:1A:2B:3C:4D:5E\`
- Stripe Webhook Key: \`sk_test_demo_sample_api_key_for_compliance_99\`
- Reviewer Contact: \`sec-compliance@corp.internal\`
- Public Gateway IPv4: \`198.51.100.42\`

---

## 4. Key Architectural Decisions (ADR)
1. **Sidecar Proxy Deployment**: Every Kubernetes pod runs Envoy 1.30 with mTLS SPIFFE/SPIRE identity certificates.
2. **Deterministic Rate Limiting**: Token bucket algorithm executed in Redis with sub-millisecond lease times.
3. **Zero Ingress Public IPs**: All traffic ingress routes through Cloudflare Magic Transit and WireGuard tunnels.`,
  },

  sla: {
    id: "sla",
    name: "SLA & Performance Report",
    category: "Business & Management",
    targetRole: "Business Owners, Executives & IT Managers",
    summary: "Clear executive uptime report comparing quarterly targets against actuals, budget depletion rates, and PDF-ready compliance summaries.",
    recommendedTab: "quill",
    markdown: `# Q3 Infrastructure Reliability & Multi-Region SLA Telemetry Report

**Reporting Period**: 2026-Q3 (July 1 – September 30)  
**Target Availability**: 99.99% ("Four Nines")  
**Compliance Standard**: SOC 2 Type II / ISO 27001  

---

## 1. Executive Summary & Availability Matrix
During the third quarter, global core services achieved an aggregated availability index of **99.993%**, preserving $72\\%$ of the allocated error budget.

\`\`\`chart-bar
Service_Tier,Actual_Uptime_pct
Edge-CDN,99.994
Auth-API,99.982
Payment-Gateway,99.991
Search-Engine,99.965
Recommendation,99.920
\`\`\`

---

## 2. High-Precision Uptime Formulation
Contractual uptime ratio is calculated excluding scheduled maintenance windows ($T_{\\text{maint}}$):

$$\\text{Availability} = \\left( 1 - \\frac{T_{\\text{outage}} - T_{\\text{maint}}}{T_{\\text{total}}} \\right) \\times 100\\%$$

Maximum permissible monthly downtime under 99.99% SLA is:

$$T_{\\text{down,max}} = 30 \\times 24 \\times 60 \\times (1 - 0.9999) = 4.32 \\text{ minutes/month}$$

---

## 3. Service Level Objective (SLO) Breakdown

| Service Tier | Tier Level | SLA Target | Actual Q3 | Error Budget Status | Compliance |
|---|---|---|---|---|---|
| Edge-CDN | Tier-0 | 99.99% | 99.994% | +40% Remaining | COMPLIANT |
| Auth-API | Tier-0 | 99.99% | 99.982% | -20% Depleted | BREACHED |
| Payment-Gateway | Tier-0 | 99.99% | 99.991% | +10% Remaining | COMPLIANT |
| Search-Engine | Tier-1 | 99.95% | 99.965% | +30% Remaining | COMPLIANT |
| Recommendations | Tier-2 | 99.90% | 99.920% | +20% Remaining | COMPLIANT |

---

## 4. Redacted Audit Trail
Audit verification executed from monitoring server \`172.16.254.1\` with reporting credentials \`AKIAJ4Y54N6EXAMPLE\` by auditor \`audit-ops@partner.internal\`.`,
  },

  readme: {
    id: "readme",
    name: "README Spec",
    category: "Developers & Newbies",
    targetRole: "Engineers, Students & Contributors",
    summary: "Clear starter spec showing how to use Markdown, embed KaTeX formulas, render D3 graphs, and redact API keys.",
    recommendedTab: "markdown",
    markdown: `# Speik — Industrial Offline-First Technical Workbench

Speik is a high-density, zero-marketing runbook, architecture RFC, and data report workbench engineered for developers, sysadmins, IT operations, and digital business leaders.

---

## 1. Core Architecture Principles
- **100% Offline-First**: Complete functionality without cloud dependencies or telemetry leaks.
- **Dual-Engine Core**: Real-time bi-directional sync between raw Markdown and Quill visual rich-text.
- **XRegExp Compliance Scrubber**: Automatic client-side detection and masking of API keys, IPs, JWTs, and MAC addresses.
- **Embedded D3 & KaTeX**: Instant mathematical equations and responsive SVG chart generation.

\`\`\`chart-histogram
Percentile,Latency_ms
P50,8.4
P75,14.2
P90,28.5
P95,52.1
P99,112.4
\`\`\`

---

## 2. Mathematical Performance Targets
Maximum client UI loop latency is constrained by the 60 FPS frame render budget:

$$\\Delta t_{\\text{frame}} \\le \\frac{1000\\text{ms}}{60} \\approx 16.67\\text{ms}$$

Debounced live preview parsing complexity is bounded by:

$$\\mathcal{O}(L + K + R)$$

Where $L$ is line count, $K$ is KaTeX formula occurrences, and $R$ is regex scrub passes.`,
  },
};
