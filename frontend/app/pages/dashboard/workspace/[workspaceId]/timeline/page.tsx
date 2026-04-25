"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { GanttChart, ChevronLeft, ChevronRight, Flag, X } from "lucide-react";
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
} from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_WIDTH = 32; // px per day column
const ROW_HEIGHT = 44; // px per task row
const LABEL_WIDTH = 220; // px for the left label column

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-blue-500",
  "in-review": "bg-violet-500",
  done: "bg-emerald-500",
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

  const color = STATUS_COLORS[task.status] ?? "bg-slate-400";

  // If no due date, render as a milestone diamond
  if (!end || endOffset === startOffset) {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
        style={{ left: left + DAY_WIDTH / 2 - 8 }}
        onClick={onClick}
        title={task.title}>
        <div
          className={`w-4 h-4 rotate-45 ${color} group-hover:scale-125 transition-transform shadow-sm`}
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-[22px] ${color} rounded-full cursor-pointer hover:brightness-110 hover:shadow-md transition-all flex items-center px-2 overflow-hidden group`}
      style={{ left, width }}
      onClick={onClick}
      title={task.title}>
      <span className="text-white text-[10px] font-semibold truncate leading-none select-none">
        {width > 60 ? task.title : ""}
      </span>
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

  useEffect(() => {
    if (!workspaceId) return;
    setIsLoading(true);
    WorkspaceTaskService.getTasks(workspaceId)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  // ── Date range: full month padded to start-of-week / end-of-week
  const rangeStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const rangeEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart, rangeEnd],
  );
  const totalDays = days.length;

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

      // Show task if it overlaps with the current month
      const taskStart = parseISO(t.created_at);
      const taskEnd = t.due_date ? parseISO(t.due_date) : taskStart;
      return taskStart <= rangeEnd && taskEnd >= rangeStart;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery, rangeStart, rangeEnd]);

  const totalWidth = totalDays * DAY_WIDTH;

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

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
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
          className="h-8 px-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40">
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-8 px-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40">
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

      {/* ── Gantt Grid ── */}
      {isLoading ? (
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
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Sticky header row */}
          <div className="flex border-b border-border sticky top-0 z-10 bg-card">
            {/* Left label spacer */}
            <div
              className="flex-shrink-0 border-r border-border bg-muted/30 flex items-end pb-2 px-4"
              style={{ width: LABEL_WIDTH }}>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Task
              </span>
            </div>

            {/* Day header */}
            <div
              className="overflow-hidden relative"
              style={{ width: totalWidth }}>
              <div className="flex">
                {days.map((day) => {
                  const isTod = isToday(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={day.toISOString()}
                      style={{ width: DAY_WIDTH, flexShrink: 0 }}
                      className={`flex flex-col items-center justify-end pb-1.5 pt-2 border-r border-border/40 last:border-r-0 ${
                        isWeekend ? "bg-muted/20" : ""
                      }`}>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isTod ? "text-primary" : "text-muted-foreground/50"
                        }`}>
                        {format(day, "EEE")[0]}
                      </span>
                      <span
                        className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isTod
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task rows */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: LABEL_WIDTH + totalWidth }}>
              {filteredTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`flex border-b border-border/40 last:border-b-0 hover:bg-muted/30 transition-colors ${
                    idx % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                  style={{ height: ROW_HEIGHT }}>
                  {/* Label */}
                  <div
                    className="flex-shrink-0 flex items-center gap-2 px-4 border-r border-border/40 cursor-pointer"
                    style={{ width: LABEL_WIDTH }}
                    onClick={() => setSelectedTask(task)}>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        STATUS_COLORS[task.status] ?? "bg-slate-400"
                      }`}
                    />
                    <span className="text-sm text-foreground truncate font-medium flex-1">
                      {task.title}
                    </span>
                    <Flag
                      className={`w-3 h-3 flex-shrink-0 ${
                        PRIORITY_ICON_COLORS[task.priority] ?? "text-slate-400"
                      }`}
                    />
                  </div>

                  {/* Bar area */}
                  <div
                    className="relative flex-1"
                    style={{ width: totalWidth }}>
                    {/* Weekend shading */}
                    {days.map((day, di) => {
                      const isWeekend =
                        day.getDay() === 0 || day.getDay() === 6;
                      return isWeekend ? (
                        <div
                          key={di}
                          className="absolute inset-y-0 bg-muted/20"
                          style={{ left: di * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      ) : null;
                    })}

                    {/* Today line */}
                    {days.some((d) => isToday(d)) && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-primary/40 z-10"
                        style={{
                          left:
                            dayOffset(new Date(), rangeStart) * DAY_WIDTH +
                            DAY_WIDTH / 2,
                        }}
                      />
                    )}

                    <TaskBar
                      task={task}
                      rangeStart={rangeStart}
                      totalDays={totalDays}
                      onClick={() => setSelectedTask(task)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setSelectedTask(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-sm bg-background border-l border-border h-full overflow-y-auto shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-foreground leading-tight">
                {selectedTask.title}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium text-white ${
                  STATUS_COLORS[selectedTask.status] ?? "bg-slate-400"
                }`}>
                {selectedTask.status}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium bg-slate-50 flex items-center gap-1 ${
                  PRIORITY_ICON_COLORS[selectedTask.priority]
                }`}>
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
                      className="flex items-center gap-2 text-sm">
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
                        }>
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
