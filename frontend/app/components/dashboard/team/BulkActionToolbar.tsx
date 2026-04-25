"use client";

import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Trash2, MoveRight, ChevronDown, CheckCircle2, X } from "lucide-react";
import { Badge } from "../../ui/badge";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMoveTasks: (status: string) => void;
  onUpdatePriority: (priority: string) => void;
  onDeleteTasks: () => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onMoveTasks,
  onUpdatePriority,
  onDeleteTasks,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
          <Badge className="bg-teal-500 text-white border-0 h-6 w-6 p-0 flex items-center justify-center rounded-full text-xs font-bold">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium text-slate-300">
            Tasks Selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-slate-500 hover:text-white hover:bg-slate-800 h-8 w-8 p-0 ml-1">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Move Status */}
          <Select onValueChange={onMoveTasks}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 w-[140px] focus:ring-teal-500/20">
              <div className="flex items-center gap-2">
                <MoveRight className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Move to..." />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              {COLUMNS.map((col) => (
                <SelectItem
                  key={col.id}
                  value={col.id}
                  className="hover:bg-slate-800 focus:bg-slate-800 text-slate-300">
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Change Priority */}
          <Select onValueChange={onUpdatePriority}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 w-[140px] focus:ring-teal-500/20">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Priority" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem
                value="low"
                className="text-emerald-400 hover:bg-slate-800">
                Low
              </SelectItem>
              <SelectItem
                value="medium"
                className="text-amber-400 hover:bg-slate-800">
                Medium
              </SelectItem>
              <SelectItem
                value="high"
                className="text-rose-400 hover:bg-slate-800">
                High
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Delete Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteTasks}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9 font-medium px-4">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="pl-6 border-l border-slate-700">
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 font-bold"
            onClick={onClearSelection}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
