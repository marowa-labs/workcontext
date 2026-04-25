import apiClient from "./apiClient";

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  description?: string;
  task?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface TimeEntryData {
  start_time: Date;
  end_time?: Date;
  duration?: number;
  description?: string;
}

export class TimeTrackingService {
  /**
   * Start a timer for a task
   */
  static async startTimer(
    taskId: string,
    description?: string,
  ): Promise<TimeEntry> {
    const response = await apiClient.post(
      `/api/workspaces/tasks/${taskId}/time/start`,
      { description },
    );
    return response as TimeEntry;
  }

  /**
   * Stop an active timer
   */
  static async stopTimer(entryId: string): Promise<TimeEntry> {
    const response = await apiClient.post(
      `/api/workspaces/tasks/time/stop/${entryId}`,
      {},
    );
    return response as TimeEntry;
  }

  /**
   * Log manual time entry
   */
  static async logTime(
    taskId: string,
    data: TimeEntryData,
  ): Promise<TimeEntry> {
    const response = await apiClient.post(
      `/api/workspaces/tasks/${taskId}/time/log`,
      data,
    );
    return response as TimeEntry;
  }

  /**
   * Get all time entries for a task
   */
  static async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const response = await apiClient.get(
      `/api/workspaces/tasks/${taskId}/time`,
    );
    return response.entries as TimeEntry[];
  }

  /**
   * Get user's active timer
   */
  static async getActiveTimer(): Promise<TimeEntry | null> {
    const response = await apiClient.get("/api/workspaces/tasks/time/active");
    return response.activeTimer as TimeEntry | null;
  }

  /**
   * Get total time spent on a task
   */
  static async getTotalTimeSpent(
    taskId: string,
  ): Promise<{ totalMinutes: number; totalHours: string }> {
    const response = await apiClient.get(
      `/api/workspaces/tasks/${taskId}/time/total`,
    );
    return response as { totalMinutes: number; totalHours: string };
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(entryId: string): Promise<void> {
    await apiClient.delete(`/api/workspaces/tasks/time/${entryId}`, null);
  }

  /**
   * Update a time entry
   */
  static async updateTimeEntry(
    entryId: string,
    data: Partial<TimeEntryData>,
  ): Promise<TimeEntry> {
    const response = await apiClient.patch(
      `/api/workspaces/tasks/time/${entryId}`,
      data,
    );
    return response as TimeEntry;
  }
}

export const timeTrackingService = TimeTrackingService;
