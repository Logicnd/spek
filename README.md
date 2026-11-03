# Spek

> **Industrial, offline-first Technical Runbook, Architecture RFC, and Data Report Workbench** built for developers, sysadmins, IT operations, and engineering leaders.

Spek opens directly to the active workbench canvas with zero marketing hero sections, zero SaaS fluff, and zero telemetry data leakage.

---

## Key Features

- **Dual-Engine Synchronized Editing**: Real-time bi-directional sync between raw GitHub Flavored Markdown (with line numbers and syntax shortcuts) and visual Quill ContentEditable WYSIWYG.
- **Client-Side Secret & Compliance Scrubber**: Powered by `XRegExp` named capture patterns. Detects and redacts IPv4/IPv6 addresses, AWS keys, Stripe API tokens, JWTs, MAC addresses, database URIs, and corporate emails with live counters and SOC2 audit exports.
- **Embedded Interactive Data Grid**: Powered by TanStack Table & TanStack Query. Import, sort, filter, and inject CSV or JSON data directly into documents or compile into charts.
- **Responsive D3.js SVG Charts**: Live rendering of embedded datasets into bar charts, time-series line graphs, and latency distribution histograms with statistical mean indicators.
- **Mathematical Rendering**: Inline (`$...$`) and display (`$$...$$`) KaTeX formulas for SLA reliability equations, computational complexity, and cryptography specifications.
- **lit-html Report Compiler**: Packages the rendered document, styled tables, KaTeX formulas, and SVG charts into a self-contained, offline-runnable `.html` file export.
- **Offline PWA Architecture**: Built with Service Worker caching (`sw.js`) and high-priority hints for 100% offline operability.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, static export via `output: 'export'`)
- **Language**: Strict TypeScript
- **Styling**: Tailwind CSS (custom industrial monochrome theme `#0a0a0a`, `#121212`, `#262626`, emerald `#10b981`, focus `#3b82f6`)
- **Icons**: Lucide React
- **Data Grid**: `@tanstack/react-table` & `@tanstack/react-query`
- **Charts & Math**: D3.js v7, KaTeX
- **Regex & Security**: XRegExp v5
- **WYSIWYG & Markdown**: Quill 2.0, Marked 15, Turndown

---

## Quickstart

```bash
# Clone the repository
git clone https://github.com/Logicnd/spek.git
cd spek

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the workbench.

---

## Production Build & Static Export

```bash
# Compile and generate static export to ./out
npm run build

# Preview offline static build locally
npx serve out
```

---

## License

MIT

