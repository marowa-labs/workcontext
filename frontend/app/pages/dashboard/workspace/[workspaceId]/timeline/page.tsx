"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  GanttChart,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  BarChart3,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import WorkspaceTaskService, {
  WorkspaceTask,
} from "../../../../../lib/utils/workspaceTaskService";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  differenceInDays,
  startOfDay,
  parseISO,
  isWeekend,
  addDays,
  differenceInCalendarDays,
} from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_WIDTH = 32;
const ROW_HEIGHT = 44;
const LABEL_WIDTH = 240;

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-blue-500",
  "in-review": "bg-violet-500",
  done: "bg-emerald-500",
};

const STATUS_GRADIENTS: Record<string, string> = {
  todo: "from-slate-400 to-slate-500",
  "in-progress": "from-blue-500 to-blue-600",
  "in-review": "from-violet-500 to-violet-600",
  done: "from-emerald-500 to-emerald-600",
};

const STATUS_HEX: Record<string, string> = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  "in-review": "#8b5cf6",
  done: "#10b981",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const PRIORITY_HEX: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#94a3b8",
};

const PRIORITY_ICON_COLORS: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dayOffset(date: Date, rangeStart: Date) {
  return differenceInDays(startOfDay(date), startOfDay(rangeStart));
}

function getCompletionPercentage(tasks: WorkspaceTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

function getStatusDistribution(tasks: WorkspaceTask[]) {
  const dist = { todo: 0, "in-progress": 0, "in-review": 0, done: 0 };
  tasks.forEach((t) => {
    if (dist[t.status as keyof typeof dist] !== undefined) {
      dist[t.status as keyof typeof dist]++;
    }
  });
  return dist;
}

function getPriorityDistribution(tasks: WorkspaceTask[]) {
  const dist = { high: 0, medium: 0, low: 0 };
  tasks.forEach((t) => {
    if (dist[t.priority as keyof typeof dist] !== undefined) {
      dist[t.priority as keyof typeof dist]++;
    }
  });
  return dist;
}

function getOverdueTasks(tasks: WorkspaceTask[], today: Date) {
  return tasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.due_date) return false;
    return parseISO(t.due_date) < today;
  });
}

function getCumulativeCompletionData(
  tasks: WorkspaceTask[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const total = tasks.length;
  if (total === 0) return days.map((d) => ({ date: d, value: 0 }));

  return days.map((day) => {
    const completed = tasks.filter((t) => {
      if (t.status !== "done") return false;
      if (!t.updated_at) return false;
      return parseISO(t.updated_at) <= day;
    }).length;
    return { date: day, value: Math.round((completed / total) * 100) };
  });
}

function getBurndownData(
  tasks: WorkspaceTask[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const total = tasks.length;
  if (total === 0) return days.map((d) => ({ date: d, ideal: 0, actual: 0 }));

  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;

  return days.map((day, i) => {
    const ideal = total - (total / (totalDays - 1)) * i;
    const remaining = tasks.filter((t) => {
      if (t.status === "done" && t.updated_at) {
        return parseISO(t.updated_at) > day;
      }
      return true;
    }).length;
    return {
      date: day,
      ideal: Math.max(0, Math.round(ideal * 10) / 10),
      actual: remaining,
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SmoothLineChart({
  data,
  width,
  height,
  color,
  label,
}: {
  data: { date: Date; value: number }[];
  width: number;
  height: number;
  color: string;
  label: string;
}) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const xStep = chartW / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (d.value / maxValue) * chartH,
  }));

  // Build smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Area fill path
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padding.top + chartH - pct * chartH,
    label: Math.round(maxValue * pct),
  }));

  const gradientId = `gradient-${label.replace(/\s/g, "")}`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {data.length > 0 ? `${data[data.length - 1].value}%` : "0%"}
        </span>
      </div>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={gl.y}
              x2={width - padding.right}
              y2={gl.y}
              stroke="currentColor"
              className="text-border/50"
              strokeDasharray="3,3"
            />
            <text
              x={padding.left - 8}
              y={gl.y + 4}
              textAnchor="end"
              className="text-[10px] fill-muted-foreground"
            >
              {gl.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
        ))}
      </svg>
    </div>
  );
}

function BurndownChart({
  tasks,
  rangeStart,
  rangeEnd,
  width,
  height,
}: {
  tasks: WorkspaceTask[];
  rangeStart: Date;
  rangeEnd: Date;
  width: number;
  height: number;
}) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const data = useMemo(
    () => getBurndownData(tasks, rangeStart, rangeEnd),
    [tasks, rangeStart, rangeEnd],
  );

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => Math.max(d.ideal, d.actual)), 1);
  const xStep = chartW / (data.length - 1 || 1);

  const idealPoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (d.ideal / maxValue) * chartH,
  }));

  const actualPoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (d.actual / maxValue) * chartH,
  }));

  // Smooth bezier for actual line
  let actualD = `M ${actualPoints[0].x} ${actualPoints[0].y}`;
  for (let i = 0; i < actualPoints.length - 1; i++) {
    const p0 = actualPoints[i - 1] || actualPoints[i];
    const p1 = actualPoints[i];
    const p2 = actualPoints[i + 1];
    const p3 = actualPoints[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    actualD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const gridLines = [0, 0.5, 1].map((pct) => ({
    y: padding.top + chartH - pct * chartH,
    label: Math.round(maxValue * pct),
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Burndown</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
            <span className="text-[10px] text-muted-foreground">Ideal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-[10px] text-muted-foreground">Actual</span>
          </div>
        </div>
      </div>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid */}
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={gl.y}
              x2={width - padding.right}
              y2={gl.y}
              stroke="currentColor"
              className="text-border/50"
              strokeDasharray="3,3"
            />
            <text
              x={padding.left - 8}
              y={gl.y + 4}
              textAnchor="end"
              className="text-[10px] fill-muted-foreground"
            >
              {gl.label}
            </text>
          </g>
        ))}

        {/* Ideal line (dashed) */}
        <polyline
          points={idealPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6,4"
          strokeLinecap="round"
        />

        {/* Actual line (smooth) */}
        <path
          d={actualD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Actual dots */}
        {actualPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

function ProgressRing({
  progress,
  size,
  color,
  label,
  sublabel,
}: {
  progress: number;
  size: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/20"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{progress}%</span>
          {sublabel && (
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground mt-2">
        {label}
      </span>
    </div>
  );
}

function TaskBar({
  task,
  rangeStart,
  totalDays,
  onClick,
}: {
  task: WorkspaceTask;
  rangeStart: Date;
  totalDays: number;
  onClick: () => void;
}) {
  const start = startOfDay(parseISO(task.created_at));
  const end = task.due_date ? startOfDay(parseISO(task.due_date)) : null;

  const startOffset = clamp(dayOffset(start, rangeStart), 0, totalDays - 1);
  const endOffset = end
    ? clamp(dayOffset(end, rangeStart), startOffset, totalDays - 1)
    : startOffset;

  const left = startOffset * DAY_WIDTH;
  const width = Math.max((endOffset - startOffset + 1) * DAY_WIDTH - 4, 12);

  const gradient =
    STATUS_GRADIENTS[task.status] ?? "from-slate-400 to-slate-500";
  const ringColor = STATUS_HEX[task.status] ?? "#94a3b8";

  // If no due date, render as a milestone diamond with ring
  if (!end || endOffset === startOffset) {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
        style={{ left: left + DAY_WIDTH / 2 - 9 }}
        onClick={onClick}
        title={task.title}
      >
        <div className="relative">
          <div
            className="absolute inset-0 w-[18px] h-[18px] rotate-45 rounded-sm"
            style={{ backgroundColor: ringColor, opacity: 0.2 }}
          />
          <div
            className={`relative w-[18px] h-[18px] rotate-45 bg-gradient-to-br ${gradient} group-hover:scale-125 transition-all duration-200 shadow-md rounded-sm`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-[24px] bg-gradient-to-r ${gradient} rounded-full cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 flex items-center px-2 overflow-hidden group`}
      style={{ left, width, boxShadow: `0 0 0 1px ${ringColor}33` }}
      onClick={onClick}
      title={task.title}
    >
      <span className="text-white text-[10px] font-semibold truncate leading-none select-none drop-shadow-sm">
        {width > 60 ? task.title : ""}
      </span>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceTimelinePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"gantt" | "analytics">("gantt");

  useEffect(() => {
    if (!workspaceId) return;
    setIsLoading(true);
    WorkspaceTaskService.getTasks(workspaceId)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  // ── Date range
  const rangeStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const rangeEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart, rangeEnd],
  );
  const totalDays = days.length;
  const totalWidth = totalDays * DAY_WIDTH;

  // ── Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.is_template) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      const taskStart = parseISO(t.created_at);
      const taskEnd = t.due_date ? parseISO(t.due_date) : taskStart;
      return taskStart <= rangeEnd && taskEnd >= rangeStart;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery, rangeStart, rangeEnd]);

  // ── Analytics data
  const completionPercentage = useMemo(
    () => getCompletionPercentage(filteredTasks),
    [filteredTasks],
  );
  const statusDist = useMemo(
    () => getStatusDistribution(filteredTasks),
    [filteredTasks],
  );
  const priorityDist = useMemo(
    () => getPriorityDistribution(filteredTasks),
    [filteredTasks],
  );
  const overdueTasks = useMemo(
    () => getOverdueTasks(filteredTasks, new Date()),
    [filteredTasks],
  );
  const cumulativeData = useMemo(
    () => getCumulativeCompletionData(filteredTasks, rangeStart, rangeEnd),
    [filteredTasks, rangeStart, rangeEnd],
  );

  const totalTasks = filteredTasks.length;
  const doneTasks = statusDist.done;
  const inProgressTasks = statusDist["in-progress"];
  const inReviewTasks = statusDist["in-review"];

  // Chart dimensions
  const chartWidth = 520;
  const chartHeight = 180;

  return (
    <div className="p-6 bg-background min-h-screen flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <GanttChart className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Timeline
            </h1>
            <p className="text-xs text-muted-foreground">
              {filteredTasks.length} tasks · {format(currentMonth, "MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("gantt")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "gantt"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GanttChart className="w-3.5 h-3.5 inline mr-1.5" />
              Gantt
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "analytics"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
              Analytics
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks…"
          className="h-8 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-8 px-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto">
          {[
            { label: "To Do", color: "bg-slate-400" },
            { label: "In Progress", color: "bg-blue-500" },
            { label: "In Review", color: "bg-violet-500" },
            { label: "Done", color: "bg-emerald-500" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rotate-45 bg-slate-400" />
            <span className="text-xs text-muted-foreground">Milestone</span>
          </div>
        </div>
      </div>

      {/* ── Analytics View ── */}
      {viewMode === "analytics" && !isLoading && filteredTasks.length > 0 && (
        <div className="flex flex-col gap-5">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              icon={Target}
              label="Total Tasks"
              value={totalTasks}
              color="text-slate-600"
              bgColor="bg-slate-100"
            />
            <KPICard
              icon={CheckCircle2}
              label="Done"
              value={doneTasks}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <KPICard
              icon={Activity}
              label="In Progress"
              value={inProgressTasks}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <KPICard
              icon={Clock}
              label="In Review"
              value={inReviewTasks}
              color="text-violet-600"
              bgColor="bg-violet-50"
            />
            <KPICard
              icon={AlertTriangle}
              label="Overdue"
              value={overdueTasks.length}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <ProgressRing
              progress={completionPercentage}
              size={80}
              color="#10b981"
              label="Complete"
              sublabel="tasks"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SmoothLineChart
              data={cumulativeData}
              width={chartWidth}
              height={chartHeight}
              color="#10b981"
              label="Cumulative Completion"
            />
            <BurndownChart
              tasks={filteredTasks}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              width={chartWidth}
              height={chartHeight}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution Donut */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Status Distribution
              </h3>
              <div className="flex items-center gap-6">
                <svg width={140} height={140} className="flex-shrink-0">
                  {(() => {
                    const total = totalTasks || 1;
                    const segments = [
                      {
                        key: "done",
                        value: statusDist.done,
                        color: STATUS_HEX.done,
                      },
                      {
                        key: "in-progress",
                        value: statusDist["in-progress"],
                        color: STATUS_HEX["in-progress"],
                      },
                      {
                        key: "in-review",
                        value: statusDist["in-review"],
                        color: STATUS_HEX["in-review"],
                      },
                      {
                        key: "todo",
                        value: statusDist.todo,
                        color: STATUS_HEX.todo,
                      },
                    ];

                    const size = 140;
                    const cx = size / 2;
                    const cy = size / 2;
                    const outerR = 60;
                    const innerR = 38;

                    let currentAngle = -Math.PI / 2;

                    const donutSegments = segments.filter((s) => s.value > 0);

                    return donutSegments.map((seg) => {
                      const pct = seg.value / total;
                      const angle = pct * Math.PI * 2;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      currentAngle = endAngle;

                      const largeArc = angle > Math.PI ? 1 : 0;

                      const x1Outer = cx + outerR * Math.cos(startAngle);
                      const y1Outer = cy + outerR * Math.sin(startAngle);
                      const x2Outer = cx + outerR * Math.cos(endAngle);
                      const y2Outer = cy + outerR * Math.sin(endAngle);

                      const x1Inner = cx + innerR * Math.cos(endAngle);
                      const y1Inner = cy + innerR * Math.sin(endAngle);
                      const x2Inner = cx + innerR * Math.cos(startAngle);
                      const y2Inner = cy + innerR * Math.sin(startAngle);

                      const path = `M ${x1Outer} ${y1Outer} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner} Z`;

                      return (
                        <path
                          key={seg.label}
                          d={path}
                          fill={seg.color}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: "To Do",
                      value: statusDist.todo,
                      color: STATUS_HEX.todo,
                    },
                    {
                      label: "In Progress",
                      value: statusDist["in-progress"],
                      color: STATUS_HEX["in-progress"],
                    },
                    {
                      label: "In Review",
                      value: statusDist["in-review"],
                      color: STATUS_HEX["in-review"],
                    },
                    {
                      label: "Done",
                      value: statusDist.done,
                      color: STATUS_HEX.done,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-foreground font-medium">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.value} (
                        {totalTasks > 0
                          ? Math.round((item.value / totalTasks) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Distribution Bar Chart */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Priority Distribution
              </h3>
              <div className="flex flex-col gap-3 mt-4">
                {[
                  {
                    label: "High",
                    value: priorityDist.high,
                    color: PRIORITY_HEX.high,
                  },
                  {
                    label: "Medium",
                    value: priorityDist.medium,
                    color: PRIORITY_HEX.medium,
                  },
                  {
                    label: "Low",
                    value: priorityDist.low,
                    color: PRIORITY_HEX.low,
                  },
                ].map((item) => {
                  const pct =
                    totalTasks > 0
                      ? Math.round((item.value / totalTasks) * 100)
                      : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.value} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Empty State ── */}
      {viewMode === "analytics" && !isLoading && filteredTasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No tasks to analyze for this period.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Try adjusting the month or filters.
            </p>
          </div>
        </div>
      )}

      {/* ── Gantt View ── */}
      {viewMode === "gantt" &&
        (isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <GanttChart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No tasks to display for this period.
              </p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Try adjusting the month or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Full-width Gantt grid */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: totalWidth }}>
                {/* Day header row */}
                <div className="flex border-b border-border sticky top-0 z-10 bg-card">
                  {days.map((day) => {
                    const isTod = isToday(day);
                    const isWknd = isWeekend(day);
                    return (
                      <div
                        key={day.toISOString()}
                        style={{ width: DAY_WIDTH, flexShrink: 0 }}
                        className={`flex flex-col items-center justify-end pb-1.5 pt-2 border-r border-border/40 last:border-r-0 ${
                          isWknd ? "bg-muted/20" : ""
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            isTod ? "text-primary" : "text-muted-foreground/50"
                          }`}
                        >
                          {format(day, "EEE")[0]}
                        </span>
                        <span
                          className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isTod
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Gantt rows - one per task */}
                {filteredTasks.map((task, idx) => {
                  const taskStart = startOfDay(parseISO(task.created_at));
                  const taskEnd = task.due_date
                    ? startOfDay(parseISO(task.due_date))
                    : taskStart;
                  const startOff = clamp(
                    dayOffset(taskStart, rangeStart),
                    0,
                    totalDays - 1,
                  );
                  const endOff = clamp(
                    dayOffset(taskEnd, rangeStart),
                    startOff,
                    totalDays - 1,
                  );
                  const barLeft = startOff * DAY_WIDTH;
                  const barWidth = Math.max(
                    (endOff - startOff + 1) * DAY_WIDTH - 4,
                    12,
                  );
                  const gradient =
                    STATUS_GRADIENTS[task.status] ??
                    "from-slate-400 to-slate-500";
                  const isMilestone = !task.due_date || endOff === startOff;

                  return (
                    <div
                      key={task.id}
                      className={`relative border-b border-border/30 last:border-b-0 ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                      }`}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Weekend shading */}
                      {days.map((day, di) =>
                        isWeekend(day) ? (
                          <div
                            key={di}
                            className="absolute inset-y-0 bg-muted/15"
                            style={{ left: di * DAY_WIDTH, width: DAY_WIDTH }}
                          />
                        ) : null,
                      )}

                      {/* Today line */}
                      {days.some((d) => isToday(d)) && (
                        <div
                          className="absolute inset-y-0 w-[2px] bg-primary/50 z-10"
                          style={{
                            left:
                              dayOffset(new Date(), rangeStart) * DAY_WIDTH +
                              DAY_WIDTH / 2,
                          }}
                        />
                      )}

                      {/* Task bar or milestone */}
                      {isMilestone ? (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 cursor-pointer group z-10"
                          style={{ left: barLeft + DAY_WIDTH / 2 - 8 }}
                          title={`${task.title} — ${format(taskStart, "MMM d")}`}
                        >
                          <div
                            className={`w-4 h-4 rotate-45 bg-gradient-to-br ${gradient} group-hover:scale-125 transition-transform shadow-md ring-2 ring-background`}
                          />
                        </div>
                      ) : (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-[24px] bg-gradient-to-r ${gradient} rounded-full cursor-pointer hover:brightness-110 hover:shadow-lg transition-all flex items-center px-2.5 overflow-hidden group ring-1 ring-black/5 z-10`}
                          style={{ left: barLeft, width: barWidth }}
                          title={`${task.title} — ${format(taskStart, "MMM d")} → ${format(taskEnd, "MMM d")}`}
                        >
                          {barWidth > 50 && (
                            <span className="text-white text-[10px] font-semibold truncate leading-none select-none drop-shadow-sm">
                              {task.title}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Priority indicator dot */}
                      <div
                        className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            PRIORITY_COLORS[task.priority] ?? "#94a3b8",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setSelectedTask(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-sm bg-background border-l border-border h-full overflow-y-auto shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-foreground leading-tight">
                {selectedTask.title}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium text-white ${
                  STATUS_COLORS[selectedTask.status] ?? "bg-slate-400"
                }`}
              >
                {selectedTask.status}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium bg-slate-50 flex items-center gap-1 ${
                  PRIORITY_ICON_COLORS[selectedTask.priority]
                }`}
              >
                <Flag className="w-3 h-3" />
                {selectedTask.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  Start
                </p>
                <p className="text-sm font-medium text-foreground">
                  {format(parseISO(selectedTask.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  Due
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedTask.due_date
                    ? format(parseISO(selectedTask.due_date), "MMM d, yyyy")
                    : "No due date"}
                </p>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {selectedTask.assignees?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Assignees
                </p>
                <div className="space-y-1.5">
                  {selectedTask.assignees.map((a) => {
                    const u = a.user;
                    const initials = u.full_name
                      ? u.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : u.email[0].toUpperCase();
                    return (
                      <div key={u.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
                          {initials}
                        </div>
                        <span className="text-sm text-foreground">
                          {u.full_name ?? u.email}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedTask.subtasks?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Subtasks (
                  {selectedTask.subtasks.filter((s) => s.is_done).length}/
                  {selectedTask.subtasks.length})
                </p>
                <div className="space-y-1">
                  {selectedTask.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                          sub.is_done
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}
                      />
                      <span
                        className={
                          sub.is_done
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }
                      >
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
