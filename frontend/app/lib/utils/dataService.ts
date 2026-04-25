import { apiClient } from "./apiClient";
import JSZip from "jszip";

interface ExportOptions {
  format: string;
  include: {
    projects: boolean;
    citations: boolean;
    comments: boolean;
    activityHistory: boolean;
    deletedItems: boolean;
  };
}

interface BackupSettings {
  enabled: boolean;
  frequency: string;
  destination: string;
  lastBackup: string | null;
}

interface StorageInfo {
  used: number;
  limit: number;
  breakdown: {
    documents: number;
    exports: number;
    uploads: number;
    citations: number;
  };
}

interface StorageAnalysis {
  currentUsage: StorageInfo;
  largestProjects: Array<{
    id: string;
    title: string;
    wordCount: number;
    citations: number;
    comments: number;
    versions: number;
    size: number;
    createdAt: string;
    updatedAt: string;
  }>;
  recentExports: Array<{
    id: string;
    fileName: string;
    fileType: string;
    size: number;
    createdAt: string;
  }>;
  aiUsage: {
    historyItems: number;
    chatMessages: number;
  };
  recommendations: string[];
}

interface StorageBreakdown {
  totalSize: number;
  breakdown: {
    documents: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        title: string;
        wordCount: number;
        size: number;
        lastModified: string;
      }>;
    };
    citations: {
      size: number;
      count: number;
    };
    comments: {
      size: number;
      count: number;
    };
    versions: {
      size: number;
      count: number;
    };
    aiHistory: {
      size: number;
      count: number;
    };
    aiChatMessages: {
      size: number;
      count: number;
    };
    exports: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        size: number;
        createdAt: string;
      }>;
    };
    backups: {
      size: number;
      count: number;
      details: Array<{
        id: string;
        size: number;
        createdAt: string;
      }>;
    };
  };
}

class DataService {
  // Get storage information
  static async getStorageInfo(): Promise<StorageInfo> {
    try {
      const response = await apiClient.get("/api/data/storage");

      // Log the response for debugging
      console.log("Storage info response:", response);

      // Fix: Check the correct response structure
      if (response && response.success) {
        // Ensure all values are properly initialized
        const storageInfo = response.storageInfo || {};
        const breakdown = storageInfo.breakdown || {};

        return {
          used: storageInfo.used || 0,
          limit: storageInfo.limit || 0,
          breakdown: {
            documents: breakdown.documents || 0,
            exports: breakdown.exports || 0,
            uploads: breakdown.uploads || 0,
            citations: breakdown.citations || 0,
          },
        };
      } else {
        const errorMessage =
          (response && response.message) || "Failed to fetch storage info";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error fetching storage info:", error);

      // If it's an API error with a response, include that in the error message
      if (error.response) {
        console.error("API Error Response:", error.response);
        throw new Error(
          `API Error: ${error.response.data?.message || error.message}`,
        );
      }

      // Return default values to prevent UI crashes
      return {
        used: 0,
        limit: 0,
        breakdown: {
          documents: 0,
          exports: 0,
          uploads: 0,
          citations: 0,
        },
      };
    }
  }

  // Export user data
  static async exportData(options: ExportOptions) {
    try {
      const response = await apiClient.post("/api/users/export", {
        format: options.format,
        include: options.include,
      });

      // Create a download link for the data
      let filename, blob;

      switch (options.format) {
        case "json":
          filename = "ScholarForge AI-data-export.json";
          const jsonData = JSON.stringify(response.data, null, 2);
          blob = new Blob([jsonData], {
            type: "application/json",
          });
          break;
        case "csv":
          filename = "ScholarForge AI-data-export.csv";
          // For CSV, we need to convert the data on the frontend
          const csvData = this.convertToCSV(response.data);
          blob = new Blob([csvData], {
            type: "text/csv",
          });
          break;
        case "zip":
          filename = "ScholarForge AI-data-export.zip";
          // Create a ZIP file with the data
          const zip = new JSZip();

          // Add data as JSON file in the ZIP
          zip.file("data.json", JSON.stringify(response.data, null, 2));

          // Add a README file
          zip.file(
            "README.txt",
            "ScholarForge AIData Export\n\nThis ZIP file contains your exported data in JSON format.",
          );

          // Generate the ZIP file
          const zipBlob = await zip.generateAsync({ type: "blob" });
          blob = zipBlob;
          break;
        default:
          filename = "ScholarForge AI-data-export.json";
          const defaultData = JSON.stringify(response.data, null, 2);
          blob = new Blob([defaultData], {
            type: "application/json",
          });
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return response;
    } catch (error: any) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }

  // Helper method to convert data to CSV format
  static convertToCSV(data: any): string {
    try {
      let csv = "Exported Data\n";
      csv += `Exported At,${data.exportedAt || new Date().toISOString()}\n\n`;

      // Add user info
      if (data.user) {
        csv += "User Info\n";
        csv += "Field,Value\n";
        csv += `ID,${data.user.id}\n`;
        csv += `Email,${data.user.email}\n`;
        csv += `Name,${data.user.full_name || ""}\n`;
        csv += `Created,${data.user.created_at}\n`;
        csv += `Institution,${data.user.institution || ""}\n`;
        csv += `Location,${data.user.location || ""}\n`;
        csv += "\n";
      }

      // Add projects summary
      if (data.projects) {
        csv += "Projects\n";
        csv += "ID,Title,Word Count,Created,Updated\n";
        data.projects.forEach((project: any) => {
          csv += `"${project.id}","${(project.title || "").replace(/"/g, '""')}","${project.word_count}","${project.created_at}","${project.updated_at}"\n`;
        });
        csv += "\n";
      }

      // Add citations summary
      if (data.citations) {
        csv += "Citations\n";
        csv += "ID,Title,Author,Year,Created\n";
        data.citations.forEach((citation: any) => {
          csv += `"${citation.id}","${(citation.title || "").replace(/"/g, '""')}","${(citation.author || "").replace(/"/g, '""')}","${citation.year || ""}","${citation.created_at}"\n`;
        });
        csv += "\n";
      }

      // Add comments summary
      if (data.comments) {
        csv += "Comments\n";
        csv += "ID,Content,Created\n";
        data.comments.forEach((comment: any) => {
          csv += `"${comment.id}","${(comment.content || "").replace(/"/g, '""').substring(0, 50)}","${comment.created_at}"\n`;
        });
        csv += "\n";
      }

      return csv;
    } catch (error) {
      console.error("Error converting to CSV:", error);
      return "Error generating CSV export";
    }
  }

  // Get backup settings
  static async getBackupSettings(): Promise<BackupSettings> {
    try {
      const response = await apiClient.get("/api/backup/schedule");
      // Fix: Check the correct response structure
      if (response && response.success) {
        // The backend returns it in `schedule`, map it to `backupSettings` for frontend code compatibility or just return it.
        // Looking at DataService struct, it expects: { enabled, frequency, destination, lastBackup }
        // The backend `schedule` has: { enabled, frequency, time, retention_count, destination }
        // `lastBackup` might not be in `schedule`.
        return response.schedule || response.backupSettings;
      } else {
        throw new Error(
          (response && response.message) || "Failed to fetch backup settings",
        );
      }
    } catch (error: any) {
      console.error("Error fetching backup settings:", error);
      throw error;
    }
  }

  // Update backup settings
  static async updateBackupSettings(settings: Partial<BackupSettings>) {
    try {
      const response = await apiClient.put("/api/backup/schedule", settings);
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response;
      } else {
        throw new Error(
          (response && response.message) || "Failed to update backup settings",
        );
      }
    } catch (error: any) {
      console.error("Error updating backup settings:", error);
      throw error;
    }
  }

  // Trigger manual backup
  static async triggerBackup(options?: { destination?: string }) {
    try {
      const response = await apiClient.post("/api/backup", {
        destination: options?.destination || "ScholarForge AI",
      });
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response;
      } else {
        throw new Error(
          (response && response.message) || "Failed to trigger backup",
        );
      }
    } catch (error: any) {
      console.error("Error triggering backup:", error);
      throw error;
    }
  }

  // Clean up storage
  static async cleanupStorage(options: {
    oldExports: boolean;
    oldDrafts: boolean;
  }) {
    try {
      const response = await apiClient.post("/api/data/cleanup", options);
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response;
      } else {
        throw new Error(
          (response && response.message) || "Failed to clean up storage",
        );
      }
    } catch (error: any) {
      console.error("Error cleaning up storage:", error);
      throw error;
    }
  }

  // Analyze storage usage
  static async analyzeStorage(): Promise<StorageAnalysis> {
    try {
      const response = await apiClient.post("/api/data/analyze", {});
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response.analysis;
      } else {
        throw new Error(
          (response && response.message) || "Failed to analyze storage",
        );
      }
    } catch (error: any) {
      console.error("Error analyzing storage:", error);
      throw error;
    }
  }

  // Get detailed storage breakdown
  static async getStorageBreakdown(): Promise<StorageBreakdown> {
    try {
      const response = await apiClient.get("/api/data/breakdown");
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response.breakdown;
      } else {
        throw new Error(
          (response && response.message) || "Failed to get storage breakdown",
        );
      }
    } catch (error: any) {
      console.error("Error getting storage breakdown:", error);
      throw error;
    }
  }

  // Monitor storage thresholds
  static async monitorStorage() {
    try {
      const response = await apiClient.post("/api/data/monitor", {});
      // Fix: Check the correct response structure
      if (response && response.success) {
        return response;
      } else {
        throw new Error(
          (response && response.message) || "Failed to monitor storage",
        );
      }
    } catch (error: any) {
      console.error("Error monitoring storage:", error);
      throw error;
    }
  }
}

export default DataService;
