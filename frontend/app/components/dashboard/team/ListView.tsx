"use client";

import { WorkspaceTask } from "../../../lib/utils/workspaceTaskService";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Clock,
  MessageSquare,
  Paperclip,
  CheckSquare,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";

interface ListViewProps {
  tasks: WorkspaceTask[];
  onTaskClick: (task: WorkspaceTask) => void;
  selectedTaskIds: string[];
  onToggleSelection: (id: string, selected: boolean) => void;
}

export function ListView({
  tasks,
  onTaskClick,
  selectedTaskIds,
  onToggleSelection,
}: ListViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-bottom border-slate-100">
            <th className="w-12 p-4">
              <div className="w-4 h-4 rounded border border-slate-300" />
            </th>
            <th className="text-left py-4 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Task
            </th>
            <th className="text-left py-4 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Status
            </th>
            <th className="text-left py-4 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Priority
            </th>
            <th className="text-left py-4 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Due Date
            </th>
            <th className="text-left py-4 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Assignees
            </th>
            <th className="w-12 py-4 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`group border-t border-slate-50 transition-colors cursor-pointer ${
                  isSelected ? "bg-teal-50/30" : "hover:bg-slate-50/50"
                }`}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div
                    onClick={() => onToggleSelection(task.id, !isSelected)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "bg-white border-slate-300 group-hover:border-teal-400"
                    }`}>
                    {isSelected && <CheckSquare className="w-3 h-3" />}
                  </div>
                </td>
                <td className="py-4 px-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-3 text-slate-400">
                      {(task.subtasks?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <CheckSquare className="w-3 h-3" />
                          {task.subtasks?.filter((s) => s.is_done).length}/
                          {task.subtasks?.length}
                        </div>
                      )}
                      {(task.comments?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments?.length}
                        </div>
                      )}
                      {(task.attachments?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Paperclip className="w-3 h-3" />
                          {task.attachments?.length}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 border-0">
                    {task.status.replace("-", " ")}
                  </Badge>
                </td>
                <td className="py-4 px-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        task.priority === "high"
                          ? "bg-rose-500"
                          : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-600 capitalize">
                      {task.priority}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-2">
                  {task.due_date ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
                <td className="py-4 px-2">
                  <div className="flex -space-x-2">
                    {task.assignees.map((assignee) => (
                      <div
                        key={assignee.user.id}
                        className="w-6 h-6 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 shadow-sm"
                        title={assignee.user.full_name || assignee.user.email}>
                        {assignee.user.full_name?.charAt(0) ||
                          assignee.user.email.charAt(0)}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">
            No tasks found match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
