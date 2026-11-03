"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface ChartDatum {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface ChartRendererProps {
  type: "bar" | "line" | "histogram";
  rawContent: string; // CSV string or JSON
  title?: string;
  unit?: string;
  height?: number;
}

/**
 * Parses embedded CSV or JSON string into normalized ChartDatum points
 */
function parseChartData(raw: string): ChartDatum[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          const keys = Object.keys(item);
          return {
            label: String(item.label || item[keys[0]] || "Item"),
            value: Number(item.value ?? item[keys[1]] ?? 0),
            secondaryValue: item.secondaryValue !== undefined ? Number(item.secondaryValue) : undefined,
          };
        });
      }
    } catch {
      // Fall through to CSV
    }
  }

  // Parse CSV
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const data: ChartDatum[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      data.push({
        label: parts[0],
        value: parseFloat(parts[1]) || 0,
        secondaryValue: parts[2] ? parseFloat(parts[2]) : undefined,
      });
    }
  }

  return data;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  rawContent,
  title,
  unit = "",
  height = 240,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const data = React.useMemo(() => parseChartData(rawContent), [rawContent]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 640;
    const margin = { top: 25, right: 30, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.28);

    // Y Axis
    const maxY = d3.max(data, (d) => d.value) || 10;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.15])
      .range([innerHeight, 0])
      .nice();

    // Subtle horizontal gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#1f1f1f")
      .attr("stroke-dasharray", "2,2");

    g.select(".grid .domain").remove();

    // Render by Chart Type
    if (type === "bar" || type === "histogram") {
      // Bars
      g.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.label) || 0)
        .attr("y", (d) => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", (d) => innerHeight - y(d.value))
        .attr("fill", "#3b82f6")
        .attr("rx", 2)
        .attr("opacity", 0.9)
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "#60a5fa").attr("opacity", 1);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", "#3b82f6").attr("opacity", 0.9);
        });

      // Bar Value Labels
      g.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.value) - 6)
        .attr("text-anchor", "middle")
        .attr("fill", "#a3a3a3")
        .attr("font-family", "ui-monospace, monospace")
        .attr("font-size", "10px")
        .text((d) => `${d.value}${unit}`);
    } else if (type === "line") {
      // Line generator
      const line = d3
        .line<ChartDatum>()
        .x((d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .y((d) => y(d.value))
        .curve(d3.curveMonotoneX);

      // Area gradient under the line
      const area = d3
        .area<ChartDatum>()
        .x((d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .y0(innerHeight)
        .y1((d) => y(d.value))
        .curve(d3.curveMonotoneX);

      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "line-area-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#10b981")
        .attr("stop-opacity", 0.25);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#10b981")
        .attr("stop-opacity", 0.0);

      g.append("path")
        .datum(data)
        .attr("fill", "url(#line-area-gradient)")
        .attr("d", area);

      // Path stroke
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Point dots
      g.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .attr("cy", (d) => y(d.value))
        .attr("r", 3.5)
        .attr("fill", "#0a0a0a")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 2);

      // Point Value Labels
      g.selectAll(".line-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "line-label")
        .attr("x", (d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .attr("fill", "#a3a3a3")
        .attr("font-family", "ui-monospace, monospace")
        .attr("font-size", "10px")
        .text((d) => `${d.value}${unit}`);
    }

    // Mean Reference Line
    const avgValue = d3.mean(data, (d) => d.value) || 0;
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", y(avgValue))
      .attr("y2", y(avgValue))
      .attr("stroke", "#ef4444")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7);

    g.append("text")
      .attr("x", innerWidth - 4)
      .attr("y", y(avgValue) - 4)
      .attr("text-anchor", "end")
      .attr("fill", "#ef4444")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", "9px")
      .attr("opacity", 0.9)
      .text(`MEAN: ${avgValue.toFixed(1)}${unit}`);

    // Render X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "#a3a3a3")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", "10px")
      .attr("dy", "0.8em")
      .attr("transform", "rotate(-15)")
      .style("text-anchor", "end");

    // Render Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}${unit}`))
      .selectAll("text")
      .attr("fill", "#737373")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", "10px");

    // Styling axis lines
    g.selectAll(".domain").attr("stroke", "#262626");
    g.selectAll(".tick line").attr("stroke", "#262626");
  }, [data, type, height, unit]);

  if (data.length === 0) {
    return (
      <div className="my-3 p-3 bg-spek-panel border border-spek-border rounded-sm font-mono text-xs text-spek-dim text-center">
        [ChartRenderer: Invalid or empty dataset for D3 chart]
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 bg-spek-panel border border-spek-border rounded-sm p-3 relative overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-spek-border pb-2 mb-2">
        <div className="font-mono text-xs font-semibold text-spek-text uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-spek-emerald" />
          {title || `D3 ${type.toUpperCase()} METRIC TELEMETRY`}
        </div>
        <div className="font-mono text-[10px] text-spek-dim">
          n={data.length} datapoints
        </div>
      </div>
      <div className="w-full flex justify-center">
        <svg ref={svgRef} className="w-full h-auto max-h-[300px]" />
      </div>
    </div>
  );
};

