"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { WorkspaceSubtask } from "../../../lib/utils/workspaceTaskService";
import { Button } from "../../ui/button";
import workspaceTaskService from "../../../lib/utils/workspaceTaskService";

interface SubtaskSectionProps {
  taskId: string;
  subtasks: WorkspaceSubtask[];
  onUpdate: (subtasks: WorkspaceSubtask[]) => void;
}

export const SubtaskSection: React.FC<SubtaskSectionProps> = ({
  taskId,
  subtasks,
  onUpdate,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const newSubtask = await workspaceTaskService.createSubtask(
        taskId,
        newSubtaskTitle,
      );
      onUpdate([...subtasks, newSubtask]);
      setNewSubtaskTitle("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add subtask", error);
    }
  };

  const handleToggleSubtask = async (id: string, is_done: boolean) => {
    try {
      const updated = await workspaceTaskService.updateSubtask(id, {
        is_done: !is_done,
      });
      onUpdate(subtasks.map((st) => (st.id === id ? updated : st)));
    } catch (error) {
      console.error("Failed to toggle subtask", error);
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    try {
      await workspaceTaskService.deleteSubtask(id);
      onUpdate(subtasks.filter((st) => st.id !== id));
    } catch (error) {
      console.error("Failed to delete subtask", error);
    }
  };

  const completedCount = subtasks.filter((st) => st.is_done).length;
  const progress =
    subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <CheckSquare className="w-5 h-5 text-indigo-500" />
          <span>Checklist</span>
        </div>
        <span className="text-sm text-slate-500">
          {completedCount}/{subtasks.length} ({Math.round(progress)}%)
        </span>
      </div>

      {subtasks.length > 0 && (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {subtasks
          .sort((a, b) => a.order - b.order)
          .map((subtask) => (
            <div
              key={subtask.id}
              className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <button
                onClick={() => handleToggleSubtask(subtask.id, subtask.is_done)}
                className="text-slate-400 hover:text-indigo-500 transition-colors">
                {subtask.is_done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  subtask.is_done
                    ? "text-slate-400 line-through"
                    : "text-slate-700"
                }`}>
                {subtask.title}
              </span>
              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>

      {isAdding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
          />
          <Button onClick={handleAddSubtask} size="sm">
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 bg-white"
          onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add a subtask
        </Button>
      )}
    </div>
  );
};
