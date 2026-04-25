"use client";

import { useState } from "react";
import { WorkspaceTask } from "../../../lib/utils/workspaceTaskService";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface CalendarViewProps {
  tasks: WorkspaceTask[];
  onTaskClick: (task: WorkspaceTask) => void;
  selectedTaskIds: string[];
  onToggleSelection: (id: string, selected: boolean) => void;
}

export function CalendarView({
  tasks,
  onTaskClick,
  selectedTaskIds,
  onToggleSelection,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), day);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900 font-outfit">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 text-xs font-bold border-slate-200 bg-slate-300">
            Today
          </Button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="h-8 w-8 p-0 rounded-none border-r border-slate-100">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0 rounded-none">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 min-h-[500px]">
          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day);
            const isPadding = !isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border-r border-b border-slate-50 relative group transition-colors ${
                  isPadding ? "bg-slate-50/30" : "bg-white"
                } ${idx % 7 === 6 ? "border-r-0" : ""}`}>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isTodayDate ? "bg-teal-600 text-white" : "text-slate-400"
                    }`}>
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-500 h-4 px-1.5 text-[10px] font-bold border-0">
                      {dayTasks.length}{" "}
                      {dayTasks.length === 1 ? "task" : "tasks"}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer truncate ${
                          isSelected
                            ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm"
                            : "bg-white border-slate-100 text-slate-700 hover:border-teal-200 hover:bg-teal-50/50"
                        }`}
                        title={task.title}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection(task.id, !isSelected);
                          }}
                          className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                            isSelected
                              ? "bg-teal-500 border-teal-500 text-white"
                              : "bg-white border-slate-300"
                          }`}>
                          {isSelected && (
                            <CheckSquare className="w-2.5 h-2.5" />
                          )}
                        </div>
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] font-bold text-slate-400 pl-1">
                      + {dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
