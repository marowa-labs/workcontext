import { apiClient } from "./apiClient";

interface Backup {
  id: string;
  user_id: string;
  name: string;
  size: number;
  status: string;
  type: string;
  storage_path: string;
  encryption_key: string | null;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

interface Restore {
  id: string;
  user_id: string;
  backup_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  backup?: {
    name: string;
    created_at: string;
  };
}

export interface BackupSchedule {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: string;
  time: string;
  retention_count: number;
  destination: string;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

class BackupService {
  // Create a new backup
  async createBackup(
    type: string = "manual",
    destination: string = "ScholarForge AI",
  ): Promise<Backup> {
    const response = await apiClient.post(
      "/api/backup",
      { type, destination },
      {},
    );
    return response.backup;
  }

  // Get user's backups
  async getUserBackups(): Promise<Backup[]> {
    const response = await apiClient.get("/api/backup");
    return response.backups;
  }

  // Get a specific backup by ID
  async getBackupById(id: string): Promise<Backup> {
    const response = await apiClient.get(`/api/backup/${id}`);
    return response.backup;
  }

  // Delete a backup
  async deleteBackup(id: string): Promise<void> {
    await apiClient.delete(`/api/backup/${id}`, {});
  }

  // Restore from a backup
  async restoreFromBackup(id: string): Promise<Restore> {
    const response = await apiClient.post(`/api/backup/${id}/restore`, {}, {});
    return response.restore;
  }

  // Get restore history
  async getUserRestores(): Promise<Restore[]> {
    const response = await apiClient.get("/api/backup/restores/history");
    return response.restores;
  }

  // Get backup schedule
  async getUserBackupSchedule(): Promise<BackupSchedule> {
    const response = await apiClient.get("/api/backup/schedule");
    return response.schedule;
  }

  // Update backup schedule
  async updateBackupSchedule(
    scheduleData: Partial<BackupSchedule>,
  ): Promise<BackupSchedule> {
    const response = await apiClient.put("/api/backup/schedule", scheduleData);
    return response.schedule;
  }

  // Get backup statistics
  async getBackupStats(): Promise<any> {
    const response = await apiClient.get("/api/backup/stats/summary");
    return response.stats;
  }
}

const backupService = new BackupService();
export default backupService;
