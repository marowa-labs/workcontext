"use client";

import React from "react";

interface TimelineChartProps {
  papers: any[];
}

export function TimelineChart({ papers }: TimelineChartProps) {
  // Aggregate data by year
  const years = React.useMemo(() => {
    const map = new Map<number, { count: number; citations: number }>();
    let minYear = new Date().getFullYear();
    let maxYear = minYear;

    papers.forEach((p) => {
      const year = p.year || 0;
      if (year < 1900) return; // Skip invalid years
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;

      const current = map.get(year) || { count: 0, citations: 0 };
      map.set(year, {
        count: current.count + 1,
        citations: current.citations + (p.citationCount || 0),
      });
    });

    const result = [];
    // Ensure all years in range exist for proper spacing
    for (let y = minYear; y <= maxYear; y++) {
      result.push({ year: y, ...(map.get(y) || { count: 0, citations: 0 }) });
    }
    return result;
  }, [papers]);

  /* SVG Line Chart Calculation */
  const maxCitations = Math.max(...years.map((y) => y.citations), 1);
  const width = 800; // Internal SVG coordinate width
  const height = 400; // Internal SVG coordinate height
  const padding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X scale (Year)
  const x = (year: number) => {
    const minYear = years[0]?.year || new Date().getFullYear();
    const maxYear = years[years.length - 1]?.year || minYear;
    if (minYear === maxYear) return padding.left + chartWidth / 2;
    return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
  };

  // Y scale (Citations)
  const y = (val: number) => {
    // Leave some headroom
    return (
      padding.top + chartHeight - (val / (maxCitations * 1.1)) * chartHeight
    );
  };

  // Generate Path D
  const linePath = React.useMemo(() => {
    if (years.length === 0) return "";
    return years.reduce((path, d, i) => {
      const px = x(d.year);
      const py = y(d.citations);
      return i === 0 ? `M ${px} ${py}` : `${path} L ${px} ${py}`;
    }, "");
  }, [years, maxCitations]);

  return (
    <div className="w-full h-full p-6 flex flex-col bg-white">
      <h3 className="text-sm font-semibold text-gray-700 pl-36 mb-2">
        Research Impact Over Time
      </h3>

      <div className="flex-1 w-full min-h-0 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none">
          {/* Grid Lines (Horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const val = Math.round(maxCitations * tick);
            const py = y(val);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={py}
                  x2={width - padding.right}
                  y2={py}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={py + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400 font-sans">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data Points & Tooltips */}
          {years.map((d) => (
            <g key={d.year} className="group cursor-pointer">
              {/* Invisible hit area for easier hovering */}
              <circle
                cx={x(d.year)}
                cy={y(d.citations)}
                r="8"
                fill="transparent"
              />

              {/* Visible Point */}
              <circle
                cx={x(d.year)}
                cy={y(d.citations)}
                r="4"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
                className="transition-all group-hover:r-6"
              />

              {/* Tooltip (SVG overlay) */}
              <foreignObject
                x={x(d.year) - 50}
                y={y(d.citations) - 50}
                width="100"
                height="40"
                className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex justify-center">
                  <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    <span className="font-bold">{d.year}</span>: {d.citations}{" "}
                    cit.
                  </div>
                </div>
              </foreignObject>

              {/* X Axis Label */}
              <text
                x={x(d.year)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-sans">
                {d.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="text-center text-xs text-gray-400 mt-2">
        Showing total citations per publication year
      </p>
    </div>
  );
}
