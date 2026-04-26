// Task Service for creating tasks from editor
import { supabase } from "../supabase/client";

export interface CreateTaskData {
  workspace_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assignee_id?: string;
}

class TaskService {
  async createTask(taskData: CreateTaskData) {
    const { data, error } = await supabase
      .from("WorkspaceTask")
      .insert([
        {
          workspace_id: taskData.workspace_id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || "todo",
          priority: taskData.priority || "medium",
          due_date: taskData.due_date,
          creator_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to create task:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async getWorkspaceTasks(workspaceId: string) {
    const { data, error } = await supabase
      .from("WorkspaceTask")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch tasks:", error);
      throw new Error(error.message);
    }

    return data || [];
  }
}

export default new TaskService();
