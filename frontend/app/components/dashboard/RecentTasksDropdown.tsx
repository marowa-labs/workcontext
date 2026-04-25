import React from "react";
import { History, Clock } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { RecentTask } from "../../hooks/useRecentTasks";
import { formatDistanceToNow } from "date-fns";

interface RecentTasksDropdownProps {
  recentTasks: RecentTask[];
  onSelectTask: (taskId: string) => void;
}

export function RecentTasksDropdown({
  recentTasks,
  onSelectTask,
}: RecentTasksDropdownProps) {
  if (recentTasks.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all gap-2"
          title="Recent Tasks">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Recent</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="text-xs font-normal text-slate-500">
          Recently Viewed
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentTasks.map((task) => (
          <DropdownMenuItem
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer">
            <div className="font-medium text-sm line-clamp-1 w-full">
              {task.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 w-full">
              <span
                className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}
              />
              <span>
                {formatDistanceToNow(new Date(task.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "bg-slate-300";
    case "IN_PROGRESS":
      return "bg-blue-400";
    case "REVIEW":
      return "bg-purple-400";
    case "DONE":
      return "bg-green-400";
    default:
      return "bg-slate-300";
  }
}
