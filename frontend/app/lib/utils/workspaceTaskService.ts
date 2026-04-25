import apiClient from "./apiClient";

export interface WorkspaceComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface WorkspaceSubtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  order: number;
}

export interface WorkspaceLabel {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

export interface WorkspaceAttachment {
  id: string;
  task_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface ViewFilters {
  priority?: string;
  assigneeIds?: string[];
  labelIds?: string[];
  dateStatus?: string;
  searchQuery?: string;
}

export interface WorkspaceView {
  id: string;
  workspace_id: string;
  name: string;
  filters: ViewFilters;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCustomField {
  id: string;
  workspace_id: string;
  name: string;
  type: "text" | "number" | "date" | "dropdown";
  options?: any; // Json in prisma
  created_at: string;
  updated_at: string;
}

export interface TaskCustomFieldValue {
  id: string;
  task_id: string;
  field_id: string;
  text_value?: string;
  number_value?: number;
  date_value?: string;
  field: WorkspaceCustomField;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  type: string;
  created_at: string;
  depends_on?: {
    id: string;
    title: string;
    status: string;
    project_id?: string; // For cross-project dependency indicators
  };
  task?: {
    id: string;
    title: string;
    status: string;
    project_id?: string;
  };
}

export interface WorkspaceTask {
  id: string;
  workspace_id: string;
  creator_id: string;
  title: string;
  description?: string;
  comments: WorkspaceComment[];
  status: string;
  priority: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: {
    user: {
      id: string;
      full_name: string | null;
      email: string;
    };
  }[];
  creator: {
    id: string;
    full_name: string | null;
    email: string;
  };
  subtasks: WorkspaceSubtask[];
  labels: WorkspaceLabel[];
  attachments: WorkspaceAttachment[];
  dependencies: TaskDependency[];
  blocked_by: TaskDependency[];

  // Recurrence fields
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  recurrence_max_occurrences?: number;
  parent_recurring_task_id?: string;
  is_recurrence_exception?: boolean;
  original_due_date?: string;

  // Project linking
  project_id?: string;

  // Template fields
  is_template?: boolean;
  template_name?: string;
  template_category?: string;

  // Custom Fields
  custom_field_values?: TaskCustomFieldValue[];
}

class WorkspaceTaskService {
  async getTasks(workspaceId: string, includeTemplates: boolean = false) {
    const response = await apiClient.get(
      `/api/workspaces/tasks?workspaceId=${workspaceId}&includeTemplates=${includeTemplates}`,
    );
    return response.tasks as WorkspaceTask[];
  }

  async getTask(taskId: string) {
    const response = await apiClient.get(`/api/workspaces/tasks/${taskId}`);
    return response.task as WorkspaceTask;
  }

  async getWorkspaceMembers(workspaceId: string) {
    const response = await apiClient.get(
      `/api/workspaces/${workspaceId}/members`,
    );
    return response as {
      id: string;
      full_name: string | null;
      email: string;
    }[];
  }

  async createTask(workspaceId: string, data: any) {
    const response = await apiClient.post("/api/workspaces/tasks", {
      workspaceId,
      ...data,
    });
    return response.task as WorkspaceTask;
  }

  async updateTask(taskId: string, data: any) {
    const response = await apiClient.patch(`/api/workspaces/tasks`, {
      taskId,
      ...data,
    });
    return response.task as WorkspaceTask;
  }

  async deleteTask(taskId: string) {
    return await apiClient.delete(`/api/workspaces/tasks?id=${taskId}`, null);
  }

  async bulkUpdateTasks(workspaceId: string, taskIds: string[], data: any) {
    const response = await apiClient.patch(`/api/workspaces/tasks/bulk`, {
      workspaceId,
      taskIds,
      ...data,
    });
    return response.tasks as WorkspaceTask[];
  }

  async bulkDeleteTasks(workspaceId: string, taskIds: string[]) {
    return await apiClient.delete(
      `/api/workspaces/tasks/bulk?workspaceId=${workspaceId}&taskIds=${encodeURIComponent(JSON.stringify(taskIds))}`,
      null,
    );
  }

  // --- Subtasks ---

  async createSubtask(taskId: string, title: string) {
    const response = await apiClient.post("/api/workspaces/tasks/subtasks", {
      taskId,
      title,
    });
    return response.subtask as WorkspaceSubtask;
  }

  async updateSubtask(subtaskId: string, data: Partial<WorkspaceSubtask>) {
    const response = await apiClient.patch(
      `/api/workspaces/tasks/subtasks/${subtaskId}`,
      data,
    );
    return response.subtask as WorkspaceSubtask;
  }

  async deleteSubtask(subtaskId: string) {
    return await apiClient.delete(
      `/api/workspaces/tasks/subtasks/${subtaskId}`,
      null,
    );
  }

  // --- Labels ---

  async getWorkspaceLabels(workspaceId: string) {
    const response = await apiClient.get(
      `/api/workspaces/${workspaceId}/labels`,
    );
    return response.labels as WorkspaceLabel[];
  }

  async createLabel(workspaceId: string, name: string, color: string) {
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/labels`,
      {
        name,
        color,
      },
    );
    return response.label as WorkspaceLabel;
  }

  async updateLabel(labelId: string, data: Partial<WorkspaceLabel>) {
    const response = await apiClient.patch(
      `/api/workspaces/labels/${labelId}`,
      data,
    );
    return response.label as WorkspaceLabel;
  }

  async deleteLabel(labelId: string) {
    return await apiClient.delete(`/api/workspaces/labels/${labelId}`, null);
  }

  async addLabelToTask(taskId: string, labelId: string) {
    const response = await apiClient.post(
      `/api/workspaces/tasks/${taskId}/labels/${labelId}`,
      {},
    );
    return response.task as WorkspaceTask;
  }

  async removeLabelFromTask(taskId: string, labelId: string) {
    const response = await apiClient.delete(
      `/api/workspaces/tasks/${taskId}/labels/${labelId}`,
      null,
    );
    return response.task as WorkspaceTask;
  }

  // --- Attachments ---

  async uploadAttachment(taskId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      `/api/workspaces/tasks/${taskId}/attachments`,
      formData,
    );
    return response.attachment as WorkspaceAttachment;
  }

  async deleteAttachment(attachmentId: string) {
    return await apiClient.delete(
      `/api/workspaces/tasks/attachments/${attachmentId}`,
      null,
    );
  }

  async cloneTask(taskId: string) {
    const response = await apiClient.post(
      `/api/workspaces/tasks/${taskId}/clone`,
      {},
    );
    return response.task as WorkspaceTask;
  }

  // --- Dependencies ---

  async addDependency(taskId: string, dependsOnId: string) {
    return await apiClient.post(
      `/api/workspaces/tasks/${taskId}/dependencies`,
      {
        dependsOnId,
      },
    );
  }

  async removeDependency(taskId: string, dependsOnId: string) {
    return await apiClient.delete(
      `/api/workspaces/tasks/${taskId}/dependencies/${dependsOnId}`,
      null,
    );
  }

  async getDependencies(taskId: string) {
    const response = await apiClient.get(
      `/api/workspaces/tasks/${taskId}/dependencies`,
    );
    return response as TaskDependency[];
  }

  // --- Workspace Views ---

  async getViews(workspaceId: string) {
    const response = await apiClient.get(
      `/api/workspaces/${workspaceId}/views`,
    );
    return response as WorkspaceView[];
  }

  async createView(workspaceId: string, name: string, filters: ViewFilters) {
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/views`,
      {
        name,
        filters,
      },
    );
    return response as WorkspaceView;
  }

  async updateView(
    workspaceId: string,
    viewId: string,
    data: Partial<WorkspaceView>,
  ) {
    const response = await apiClient.patch(
      `/api/workspaces/${workspaceId}/views/${viewId}`,
      data,
    );
    return response as WorkspaceView;
  }

  async deleteView(workspaceId: string, viewId: string) {
    return await apiClient.delete(
      `/api/workspaces/${workspaceId}/views/${viewId}`,
      null,
    );
  }

  // --- Templates ---

  async getTemplates(workspaceId: string) {
    const response = await apiClient.get(
      `/api/workspaces/tasks/templates/all?workspaceId=${workspaceId}`,
    );
    return response.templates as WorkspaceTask[];
  }

  async saveAsTemplate(
    taskId: string,
    templateName: string,
    category?: string,
  ) {
    const response = await apiClient.post(
      "/api/workspaces/tasks/templates/save",
      {
        taskId,
        templateName,
        category,
      },
    );
    return response.template as WorkspaceTask;
  }

  async createFromTemplate(templateId: string, overrides: any = {}) {
    const response = await apiClient.post(
      "/api/workspaces/tasks/from-template",
      {
        templateId,
        overrides,
      },
    );
    return response.task as WorkspaceTask;
  }

  // --- Custom Fields ---

  async getCustomFieldDefinitions(workspaceId: string) {
    const response = await apiClient.get(
      `/api/workspaces/${workspaceId}/custom-fields`,
    );
    return response.fields as WorkspaceCustomField[];
  }

  async createCustomFieldDefinition(
    workspaceId: string,
    data: { name: string; type: string; options?: string[] },
  ) {
    const response = await apiClient.post(
      `/api/workspaces/${workspaceId}/custom-fields`,
      data,
    );
    return response.field as WorkspaceCustomField;
  }

  async deleteCustomFieldDefinition(workspaceId: string, fieldId: string) {
    return await apiClient.delete(
      `/api/workspaces/${workspaceId}/custom-fields/definitions/${fieldId}`,
      null,
    );
  }

  async updateTaskCustomFields(taskId: string, values: Record<string, any>) {
    const response = await apiClient.patch(
      `/api/workspaces/tasks/${taskId}/custom-fields`,
      { values },
    );
    return response.task as WorkspaceTask;
  }
}

export default new WorkspaceTaskService();
