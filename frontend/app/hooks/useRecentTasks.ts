import { useState, useEffect } from "react";
import { WorkspaceTask } from "../lib/utils/workspaceTaskService";

const STORAGE_KEY = "scholarforge_recent_tasks";
const MAX_RECENT_TASKS = 5;

export interface RecentTask {
  id: string;
  title: string;
  project_id?: string;
  status: string;
  updated_at: string;
}

export function useRecentTasks() {
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recent tasks", error);
    }
  }, []);

  // Add a task to recent history
  const addRecentTask = (task: WorkspaceTask) => {
    setRecentTasks((prev) => {
      // Remove if already exists (to move to top)
      const filtered = prev.filter((t) => t.id !== task.id);

      const newItem: RecentTask = {
        id: task.id,
        title: task.title,
        project_id: task.project_id,
        status: task.status,
        updated_at: new Date().toISOString(),
      };

      const revised = [newItem, ...filtered].slice(0, MAX_RECENT_TASKS);

      // Persist to local storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(revised));
      } catch (error) {
        console.error("Failed to save recent tasks", error);
      }

      return revised;
    });
  };

  return {
    recentTasks,
    addRecentTask,
  };
}
