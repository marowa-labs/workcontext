"use client";

import { useRef, useEffect, useMemo } from "react";

export interface ChartSeries {
  data: number[];
  color: string;
  label: string;
}

interface SmoothAreaChartProps {
  series: ChartSeries[];
  labels: string[];
  height?: number;
  className?: string;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  labels: string[],
  width: number,
  height: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const padding = { top: 8, right: 4, bottom: 24, left: 34 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width * dpr, height * dpr);

  let globalMax = 0;
  for (const s of series) {
    for (const v of s.data) {
      if (v > globalMax) globalMax = v;
    }
  }
  if (globalMax === 0) globalMax = 1;

  const pointCount = labels.length;

  // ---- Grid lines (drawn behind series) ----
  ctx.save();
  const gridColor = "#e2e8f0"; // slate-200
  const gridLineWidth = 0.5 * dpr;

  // Horizontal grid lines — 4 lines dividing the chart area
  const hGridCount = 4;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = gridLineWidth;
  ctx.setLineDash([3 * dpr, 3 * dpr]);
  const bottomY = padding.top + chartH;
  for (let g = 0; g <= hGridCount; g++) {
    const y = padding.top + (g / hGridCount) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  // Vertical grid lines — one per x-axis label
  for (let i = 0; i < pointCount; i++) {
    const x = padding.left + (i / Math.max(pointCount - 1, 1)) * chartW;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, bottomY);
    ctx.stroke();
  }

  // Y-axis value labels on the left of grid lines
  ctx.setLineDash([]);
  ctx.fillStyle = "#94a3b8";
  ctx.font = 8 * dpr + "px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let g = 0; g <= hGridCount; g++) {
    const y = padding.top + (g / hGridCount) * chartH;
    const labelVal = Math.round(globalMax * (1 - g / hGridCount));
    ctx.fillText(labelVal.toString(), padding.left - 3, y);
  }
  ctx.restore();

  for (const s of series) {
    const points: { x: number; y: number }[] = s.data.map((value, i) => ({
      x: padding.left + (i / Math.max(pointCount - 1, 1)) * chartW,
      y: padding.top + ((globalMax - value) / globalMax) * chartH,
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const dx = (next.x - curr.x) * 0.35;
      ctx.bezierCurveTo(
        curr.x + dx,
        curr.y,
        next.x - dx,
        next.y,
        next.x,
        next.y,
      );
    }
    const last = points[points.length - 1];
    const first = points[0];
    const bottomY = padding.top + chartH;
    ctx.lineTo(last.x, bottomY);
    ctx.lineTo(first.x, bottomY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, bottomY);
    gradient.addColorStop(0, s.color + "4D");
    gradient.addColorStop(1, s.color + "05");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const dx = (next.x - curr.x) * 0.35;
      ctx.bezierCurveTo(
        curr.x + dx,
        curr.y,
        next.x - dx,
        next.y,
        next.x,
        next.y,
      );
    }
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // X-axis labels
  ctx.fillStyle = "#94a3b8";
  ctx.font = `${10 * dpr}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (let i = 0; i < labels.length; i++) {
    const x = padding.left + (i / Math.max(pointCount - 1, 1)) * chartW;
    ctx.fillText(labels[i], x, height - 4);
  }
}

export default function SmoothAreaChart({
  series,
  labels,
  height = 192,
  className = "",
}: SmoothAreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pointCount = labels.length;
  const minWidth = Math.max(pointCount * 44, 100);
  const chartPixelHeight = Math.round(height);

  const seriesKey = useMemo(
    () => JSON.stringify(series.map((s) => ({ d: s.data, c: s.color }))),
    [series],
  );
  const labelsKey = labels.join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = canvas.parentElement?.clientWidth || minWidth;

    canvas.width = containerWidth * dpr;
    canvas.height = chartPixelHeight * dpr;
    canvas.style.width = containerWidth + "px";
    canvas.style.height = chartPixelHeight + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    drawChart(ctx, series, labels, containerWidth, chartPixelHeight);
  }, [seriesKey, labelsKey, minWidth, chartPixelHeight]);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div
        style={{ minWidth: `${minWidth}px`, height: `${chartPixelHeight}px` }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
