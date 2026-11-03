"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  Upload,
  ArrowUpDown,
  Search,
  FileSpreadsheet,
  PlusCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Database,
  Trash2,
} from "lucide-react";
import { trackEvent } from "../lib/analytics";

interface DataGridProps {
  onInjectMarkdown: (markdown: string) => void;
  onInjectChart: (chartMarkdown: string) => void;
}

// Preset industry benchmark datasets
const PRESET_DATASETS: Record<string, { name: string; csv: string }> = {
  latency: {
    name: "API Gateway Latency Metrics",
    csv: `Service,P50_ms,P95_ms,P99_ms,ErrorRate_pct,Throughput_rps
auth-service,12.4,45.2,120.8,0.02,4250
billing-api,34.1,89.5,245.0,0.15,1120
search-query,8.2,28.4,72.1,0.01,8900
user-profile,15.6,52.3,140.2,0.04,3600
notifications,6.1,19.8,48.5,0.00,2400
inventory-sync,48.7,112.0,320.4,0.32,850`,
  },
  incident: {
    name: "Incident Severity & MTTR Log",
    csv: `Incident_ID,Severity,Component,Impacted_Users,MTTR_min,Resolved
INC-4091,P1-CRITICAL,Kafka-Broker-Cluster,45000,18,Yes
INC-4092,P2-HIGH,Redis-Session-Store,12000,34,Yes
INC-4093,P3-MEDIUM,Email-Webhook-Worker,1800,75,Yes
INC-4094,P1-CRITICAL,Postgres-Primary-Failover,82000,24,Yes
INC-4095,P2-HIGH,Ingress-SSL-Renewal,5400,42,Yes`,
  },
  infrastructure: {
    name: "Cloud Fleet & Cost Matrix",
    csv: `Cluster_Name,Region,Nodes,Monthly_Cost_USD,CPU_Util_pct,RAM_Util_pct
prod-us-east-1,us-east-1,48,14250.00,74.2,82.5
prod-eu-west-1,eu-west-1,32,9600.00,68.4,76.1
prod-ap-northeast-1,ap-northeast-1,24,7800.00,61.9,70.4
staging-us-east-1,us-east-1,12,3200.00,42.0,51.8
dr-us-west-2,us-west-2,16,4800.00,28.5,35.0`,
  },
  slo: {
    name: "Microservice SLO Availability",
    csv: `Service_Tier,Tier_Level,SLA_Target_pct,Actual_30d_pct,Error_Budget_pct,Compliance
Edge-CDN,Tier-0,99.99,99.994,40.0,Compliant
Auth-API,Tier-0,99.99,99.982,-20.0,Breached
Payment-Gateway,Tier-0,99.99,99.991,10.0,Compliant
Search-Engine,Tier-1,99.95,99.965,30.0,Compliant
Recommendation,Tier-2,99.90,99.920,20.0,Compliant`,
  },
};

/**
 * Parses raw CSV into dynamic headers and record objects
 */
function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ?? "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Parses JSON array of objects
 */
function parseJSON(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return { headers: [], rows: [] };

    const headers = Object.keys(parsed[0]);
    const rows = parsed.map((item) => {
      const obj: Record<string, string> = {};
      headers.forEach((h) => {
        obj[h] = String(item[h] ?? "");
      });
      return obj;
    });

    return { headers, rows };
  } catch {
    return { headers: [], rows: [] };
  }
}

export const DataGrid: React.FC<DataGridProps> = ({ onInjectMarkdown, onInjectChart }) => {
  const [rawInput, setRawInput] = useState<string>(PRESET_DATASETS.latency.csv);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

  // Parse structured data dynamically
  const { headers, rows } = useMemo(() => {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      return parseJSON(trimmed);
    }
    return parseCSV(trimmed);
  }, [rawInput]);

  // Construct TanStack column definitions dynamically
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    return headers.map((colName) => ({
      accessorKey: colName,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1.5 hover:text-white font-mono font-medium text-xs tracking-wider transition-colors text-left"
        >
          <span>{colName}</span>
          <ArrowUpDown className="w-3 h-3 text-spek-dim hover:text-spek-text" />
        </button>
      ),
      cell: (info) => (
        <span className="font-mono text-xs text-spek-text whitespace-nowrap">
          {String(info.getValue())}
        </span>
      ),
    }));
  }, [headers]);

  // Initialize TanStack Table instance
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Action: Convert active data into GitHub Flavored Markdown Table
  const handleInjectMarkdown = () => {
    if (headers.length === 0 || rows.length === 0) return;

    const headerLine = `| ${headers.join(" | ")} |`;
    const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
    const rowLines = rows.map((r) => `| ${headers.map((h) => r[h] || "").join(" | ")} |`);

    const markdownTable = `\n${headerLine}\n${separatorLine}\n${rowLines.join("\n")}\n`;
    onInjectMarkdown(markdownTable);

    trackEvent({
      event: "table_imported",
      row_count: rows.length,
      col_count: headers.length,
      import_type: "csv",
    });
  };

  // Action: Convert numeric columns into embedded D3 chart markdown block
  const handleInjectChart = () => {
    if (headers.length < 2 || rows.length === 0) return;

    const labelKey = headers[0];
    const valueKey = headers[1];

    const chartBlock = `\n\`\`\`chart-bar\nlabel,value\n${rows
      .slice(0, 10)
      .map((r) => `${r[labelKey]},${parseFloat(r[valueKey]) || 0}`)
      .join("\n")}\n\`\`\`\n`;

    onInjectChart(chartBlock);
  };

  // Load a preset
  const handleLoadPreset = (key: string) => {
    const preset = PRESET_DATASETS[key];
    if (preset) {
      setRawInput(preset.csv);
      setSorting([]);
      setGlobalFilter("");
      setPagination({ pageIndex: 0, pageSize: 8 });
    }
  };

  return (
    <div className="flex flex-col h-full bg-spek-panel border border-spek-border text-spek-text">
      {/* Top Toolbar */}
      <div className="px-3 py-2 bg-spek-elevated border-b border-spek-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-spek-emerald" />
          <span className="font-mono font-semibold tracking-wider text-white">DATA GRID</span>
          <span className="text-spek-dim font-mono text-[11px]">
            [{rows.length} rows × {headers.length} cols]
          </span>
        </div>

        {/* Preset Selectors */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className="text-spek-dim mr-1">Presets:</span>
          {Object.entries(PRESET_DATASETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handleLoadPreset(key)}
              className="px-2 py-0.5 bg-spek-subtle hover:bg-spek-border text-spek-muted hover:text-white border border-spek-border rounded-sm transition-colors"
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Table Operations */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInjectMarkdown}
            disabled={rows.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 bg-spek-blue/20 hover:bg-spek-blue/30 text-blue-400 border border-spek-blue/40 rounded-sm font-mono text-[11px] transition-colors disabled:opacity-40"
            title="Inject table as Markdown into document"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Inject Table</span>
          </button>
          <button
            onClick={handleInjectChart}
            disabled={rows.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 bg-spek-emerald/20 hover:bg-spek-emerald/30 text-emerald-400 border border-spek-emerald/40 rounded-sm font-mono text-[11px] transition-colors disabled:opacity-40"
            title="Generate D3 Bar Chart block"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Plot Chart</span>
          </button>
        </div>
      </div>

      {/* Raw Input Toggle / Search */}
      <div className="px-3 py-2 bg-spek-panel border-b border-spek-border flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-spek-dim absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-spek-bg border border-spek-border pl-8 pr-2 py-1 text-xs font-mono text-spek-text placeholder-spek-dim rounded-sm focus:outline-none focus:border-spek-blue"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-spek-dim">
          <span>Sortable column headers</span>
          <span className="text-spek-border">|</span>
          <button
            onClick={() => setRawInput("")}
            className="hover:text-spek-red flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-auto">
        {headers.length > 0 ? (
          <table className="w-full border-collapse text-left font-mono text-xs">
            <thead className="sticky top-0 bg-spek-elevated border-b border-spek-border shadow-sm z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-spek-muted border-r border-spek-border last:border-r-0 select-none"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-spek-border/50 hover:bg-spek-subtle transition-colors ${
                      idx % 2 === 0 ? "bg-spek-panel" : "bg-spek-bg/60"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-1.5 border-r border-spek-border/50 last:border-r-0 text-spek-text"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="p-6 text-center text-spek-dim font-mono text-xs"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <FileSpreadsheet className="w-10 h-10 text-spek-dim mb-3" />
            <div className="font-mono text-sm text-spek-text mb-1">No Data Available</div>
            <div className="font-mono text-xs text-spek-dim max-w-sm">
              Paste CSV or JSON records below or pick one of the presets above.
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {headers.length > 0 && (
        <div className="px-3 py-2 bg-spek-elevated border-t border-spek-border flex items-center justify-between font-mono text-xs text-spek-dim">
          <div className="flex items-center gap-2">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <span>({rows.length} total rows)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 bg-spek-subtle hover:bg-spek-border text-spek-text border border-spek-border rounded-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 bg-spek-subtle hover:bg-spek-border text-spek-text border border-spek-border rounded-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Raw CSV / JSON Input Area */}
      <div className="border-t border-spek-border bg-spek-bg p-2.5">
        <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono text-spek-dim">
          <span>PASTE RAW CSV OR JSON STREAM</span>
          <span>Auto-parsed on edit</span>
        </div>
        <textarea
          rows={3}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Paste comma-separated values (CSV) or JSON array..."
          className="w-full bg-spek-panel border border-spek-border text-spek-text font-mono text-xs p-2 rounded-sm focus:outline-none focus:border-spek-blue resize-none"
        />
      </div>
    </div>
  );
};

