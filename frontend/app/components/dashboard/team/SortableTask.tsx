"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WorkspaceTask } from "../../../lib/utils/workspaceTaskService";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  Calendar,
  Trash2,
  GripVertical,
  CheckSquare,
  Paperclip,
  Lock,
  Repeat,
} from "lucide-react";
import { format } from "date-fns";

interface SortableTaskProps {
  task: WorkspaceTask;
  onDelete: () => void;
  onClick: (task: WorkspaceTask) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string, selected: boolean) => void;
}

export function SortableTask({
  task,
  onDelete,
  onClick,
  isSelected = false,
  onToggleSelection,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColors: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    high: "bg-red-50 text-red-700 border-red-100",
  };

  const now = new Date();
  const isOverdue =
    task.due_date && new Date(task.due_date) < now && task.status !== "done";
  const isDueSoon =
    task.due_date &&
    new Date(task.due_date) > now &&
    new Date(task.due_date).getTime() < now.getTime() + 24 * 60 * 60 * 1000 &&
    task.status !== "done";

  const isBlocked =
    task.dependencies &&
    task.dependencies.some((dep) => dep.depends_on?.status !== "done");

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelection) {
      onToggleSelection(task.id, !isSelected);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card p-3 rounded-xl border transition-all cursor-default relative ${
        isSelected
          ? "border-teal-500 shadow-md ring-1 ring-teal-500/20"
          : "border-border shadow-sm hover:border-teal-200 dark:hover:border-teal-800 hover:shadow-md"
      } ${isDragging ? "z-50" : ""}`}
      onClick={() => onClick(task)}>
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-2 mt-1">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </div>

          <div
            onClick={handleCheckboxClick}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
              isSelected
                ? "bg-teal-500 border-teal-500 text-white"
                : "bg-background border-input group-hover:border-teal-400 dark:group-hover:border-teal-600"
            }`}>
            {isSelected && <CheckSquare className="w-3 h-3" />}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-hidden cursor-pointer">
          <div className="flex items-center justify-between">
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <p className="text-sm font-medium text-foreground leading-tight flex items-center gap-1.5">
            {task.title}
            {task.is_recurring && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                <Repeat className="w-2.5 h-2.5" />
                Repeats
              </span>
            )}
          </p>

          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <div
                  key={label.id}
                  className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: label.color }}>
                  {label.name}
                </div>
              ))}
            </div>
          )}

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description.replace(/<[^>]*>/g, "")}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CheckSquare className="w-3 h-3" />
                  {task.subtasks.filter((s) => s.is_done).length}/
                  {task.subtasks.length}
                </div>
              )}
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Paperclip className="w-3 h-3" />
                  {task.attachments.length}
                </div>
              )}
              {isBlocked && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  <Lock className="w-3 h-3" />
                  Blocked
                </div>
              )}
            </div>

            <div className="flex -space-x-2">
              {task.assignees?.map((assignee, idx) => (
                <Avatar
                  key={assignee.user.id}
                  className="h-5 w-5 border-2 border-background shadow-sm"
                  style={{ zIndex: task.assignees.length - idx }}>
                  <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                    {assignee.user.full_name?.charAt(0) ||
                      assignee.user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
