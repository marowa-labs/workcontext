"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, X, ChevronDown, Check } from "lucide-react";
import {
  WorkspaceLabel,
  WorkspaceTask,
} from "../../../lib/utils/workspaceTaskService";
import workspaceTaskService from "../../../lib/utils/workspaceTaskService";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";

interface LabelSelectorProps {
  workspaceId: string;
  taskId: string;
  selectedLabels: WorkspaceLabel[];
  onUpdate: (task: WorkspaceTask) => void;
}

const COLORS = [
  "#94a3b8", // slate
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  workspaceId,
  taskId,
  selectedLabels,
  onUpdate,
}) => {
  const [availableLabels, setAvailableLabels] = useState<WorkspaceLabel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(COLORS[0]);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const labels =
          await workspaceTaskService.getWorkspaceLabels(workspaceId);
        setAvailableLabels(labels);
      } catch (error) {
        console.error("Failed to fetch labels", error);
      }
    };
    fetchLabels();
  }, [workspaceId]);

  const handleToggleLabel = async (label: WorkspaceLabel) => {
    const isSelected = selectedLabels.some((l) => l.id === label.id);
    try {
      let updatedTask;
      if (isSelected) {
        updatedTask = await workspaceTaskService.removeLabelFromTask(
          taskId,
          label.id,
        );
      } else {
        updatedTask = await workspaceTaskService.addLabelToTask(
          taskId,
          label.id,
        );
      }
      onUpdate(updatedTask);
    } catch (error) {
      console.error("Failed to toggle label", error);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const label = await workspaceTaskService.createLabel(
        workspaceId,
        newLabelName,
        newLabelColor,
      );
      setAvailableLabels([...availableLabels, label]);
      setNewLabelName("");
      setIsCreating(false);
      // Automatically add it to the task
      const updatedTask = await workspaceTaskService.addLabelToTask(
        taskId,
        label.id,
      );
      onUpdate(updatedTask);
    } catch (error) {
      console.error("Failed to create label", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-semibold text-slate-700">
        <Tag className="w-5 h-5 text-indigo-500" />
        <span>Labels</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedLabels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: label.color }}>
            {label.name}
            <button
              onClick={() => handleToggleLabel(label)}
              className="hover:bg-black/10 rounded-full transition-colors p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Plus className="w-3 h-3" />
              Add Label
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            {!isCreating ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                  Workspace Labels
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableLabels.length > 0 ? (
                    availableLabels.map((label) => {
                      const isSelected = selectedLabels.some(
                        (l) => l.id === label.id,
                      );
                      return (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="text-sm text-slate-700">
                              {label.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-indigo-500" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-400 text-center py-2">
                      No labels created yet
                    </div>
                  )}
                </div>
                <hr className="my-2 border-slate-100" />
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full text-left text-sm text-indigo-600 font-medium hover:text-indigo-700 p-1 px-2">
                  + Create New Label
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Create Label
                  </span>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Label name..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newLabelColor === color
                          ? "scale-125 ring-2 ring-indigo-500/50"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleCreateLabel}
                  size="sm"
                  className="w-full">
                  Create
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
