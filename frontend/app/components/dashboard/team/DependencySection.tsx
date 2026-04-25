"use client";

import React, { useState } from "react";
import { Link2, Layers, X, Plus, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import workspaceTaskService, {
  WorkspaceTask,
  TaskDependency,
} from "../../../lib/utils/workspaceTaskService";
import { cn } from "../../../lib/utils";

interface ExtendedWorkspaceTask extends WorkspaceTask {
  project?: {
    title: string;
  };
}

interface ExtendedTaskDependency extends Omit<
  TaskDependency,
  "depends_on" | "task"
> {
  depends_on?: {
    id: string;
    title: string;
    status: string;
    project_id?: string | null;
    project?: {
      title: string;
    };
  };
  task?: {
    id: string;
    title: string;
    status: string;
    project_id?: string | null;
    project?: {
      title: string;
    };
  };
}

interface DependencySectionProps {
  workspaceId: string;
  taskId: string;
  dependencies: ExtendedTaskDependency[];
  blockedBy: any[]; // Using any to avoid complex type matching for now, as we just display title
  onUpdate: (updatedTask: WorkspaceTask) => void;
}

export const DependencySection: React.FC<DependencySectionProps> = ({
  workspaceId,
  taskId,
  dependencies,
  blockedBy,
  onUpdate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [allTasks, setAllTasks] = useState<ExtendedWorkspaceTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await workspaceTaskService.getTasks(workspaceId);
      // Filter out current task and already added dependencies
      const filtered = tasks.filter(
        (t) =>
          t.id !== taskId &&
          !dependencies.some((d) => d.depends_on_id === t.id),
      );
      setAllTasks(filtered as ExtendedWorkspaceTask[]);
    } catch (error) {
      console.error("Error fetching tasks for dependencies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDependency = async (dependsOnId: string) => {
    try {
      await workspaceTaskService.addDependency(taskId, dependsOnId);
      setIsAdding(false);
      // Refresh task data via parent
      const updatedTasks = await workspaceTaskService.getTasks(workspaceId);
      const currentTask = updatedTasks.find((t) => t.id === taskId);
      if (currentTask) onUpdate(currentTask);
    } catch (error: any) {
      alert(error.message || "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (dependsOnId: string) => {
    try {
      await workspaceTaskService.removeDependency(taskId, dependsOnId);
      const updatedTasks = await workspaceTaskService.getTasks(workspaceId);
      const currentTask = updatedTasks.find((t) => t.id === taskId);
      if (currentTask) onUpdate(currentTask);
    } catch (error) {
      console.error("Error removing dependency:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dependencies Section (Tasks this task depends on) */}
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Link2 className="h-3 w-3" /> Dependencies (Blocked By)
        </Label>

        <div className="flex flex-wrap gap-2">
          {dependencies.map((dep) => (
            <Badge
              key={dep.id}
              variant="secondary"
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 py-1 gap-1.5 group flex items-center h-auto py-1.5">
              <div className="flex flex-col items-start gap-0.5">
                {dep.depends_on?.project?.title && (
                  <span
                    className="text-[9px] uppercase tracking-wider text-teal-600 font-semibold"
                    title="Cross-project dependency">
                    {dep.depends_on.project.title}
                  </span>
                )}
                <span className="truncate max-w-[150px] font-medium leading-none">
                  {dep.depends_on?.title || "Unknown Task"}
                </span>
              </div>
              <button
                onClick={() => handleRemoveDependency(dep.depends_on_id)}
                className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Popover
            open={isAdding}
            onOpenChange={(open) => {
              setIsAdding(open);
              if (open) fetchTasks();
            }}>
            <PopoverTrigger asChild className="text-slate-700 bg-slate-200">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] border-dashed border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 gap-1.5">
                <Plus className="h-3 w-3" /> Add Dependency
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[350px] bg-slate-100 border-slate-200"
              align="start">
              <Command>
                <CommandInput
                  placeholder="Search tasks across workspace..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  {isLoading ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No tasks found.</CommandEmpty>
                      <CommandGroup
                        heading="Available Tasks"
                        className="text-slate-700">
                        {allTasks.map((t) => (
                          <CommandItem
                            key={t.id}
                            onSelect={() => handleAddDependency(t.id)}
                            className="text-xs py-2 text-slate-700 cursor-pointer">
                            <div className="flex flex-col flex-1 gap-1">
                              <span className="font-medium">{t.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {t.status}
                                </span>
                                {t.project?.title && (
                                  <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                                    in {t.project.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Blocked Tasks Section (Tasks that depend on this task) */}
      {blockedBy.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3 w-3" /> Blocking (Blocked Tasks)
          </Label>
          <div className="flex flex-wrap gap-2">
            {blockedBy.map((dep) => (
              <Badge
                key={dep.id}
                variant="outline"
                className="border-slate-200 text-slate-500 px-2 py-1 italic flex flex-col items-start gap-0.5 h-auto py-1.5">
                {dep.task?.project?.title && (
                  <span className="text-[9px] uppercase tracking-wider text-teal-600 font-semibold not-italic">
                    {dep.task.project.title}
                  </span>
                )}
                <span className="leading-none">
                  {dep.task?.title || "Unknown Task"}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
