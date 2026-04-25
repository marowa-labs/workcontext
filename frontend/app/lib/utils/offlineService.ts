import { apiClient } from "./apiClient";

interface OfflineChange {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: any;
  timestamp: string;
  synced: boolean;
  error: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

interface CachedDocument {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  content: any;
  word_count: number;
  last_modified: string;
  cached_at: string;
  is_dirty: boolean;
  version: number;
}

interface OfflineSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  auto_sync: boolean;
  cache_size_limit: number;
  last_sync: string | null;
  sync_interval: number;
  notify_on_sync_error: boolean;
  created_at: string;
  updated_at: string;
}

class OfflineService {
  // Get pending offline changes
  async getPendingOfflineChanges(): Promise<OfflineChange[]> {
    try {
      const response = await apiClient.get("/api/offline/changes");
      return response.data?.changes || [];
    } catch (error: any) {
      console.error("Error fetching pending offline changes:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        // The apiClient should already redirect to login, but we can ensure it
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      // Handle timeout and abort errors gracefully - don't flood console with timeout errors
      if (
        error.message &&
        (error.message.includes("timeout") || error.message.includes("aborted"))
      ) {
        console.warn("Offline changes fetch timed out, returning empty array");
        return [];
      }

      // Return empty array but log the specific error
      return [];
    }
  }

  // Create an offline change record
  async createOfflineChange(
    entityType: string,
    entityId: string,
    operation: string,
    payload: any
  ): Promise<OfflineChange | null> {
    try {
      const response = await apiClient.post("/api/offline/changes", {
        entityType,
        entityId,
        operation,
        payload,
      });
      return response.data?.change || null;
    } catch (error: any) {
      console.error("Error creating offline change:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return null;
    }
  }

  // Get cached document
  async getCachedDocument(projectId: string): Promise<CachedDocument> {
    try {
      const response = await apiClient.get(
        `/api/offline/documents/${projectId}`
      );
      return response.data?.document || ({} as CachedDocument);
    } catch (error: any) {
      console.error("Error fetching cached document:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return {} as CachedDocument;
    }
  }

  // Cache a document for offline access
  async cacheDocument(
    projectId: string,
    documentData: any
  ): Promise<CachedDocument> {
    try {
      const response = await apiClient.post("/api/offline/documents/cache", {
        projectId,
        documentData,
      });
      return response.data?.document || ({} as CachedDocument);
    } catch (error: any) {
      console.error("Error caching document:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return {} as CachedDocument;
    }
  }

  // Get user cached documents
  async getUserCachedDocuments(): Promise<CachedDocument[]> {
    try {
      const response = await apiClient.get("/api/offline/documents");
      return response.data?.documents || [];
    } catch (error: any) {
      console.error("Error fetching user cached documents:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return [];
    }
  }

  // Mark changes as synced
  async markChangesAsSynced(changeIds: string[]): Promise<void> {
    try {
      await apiClient.post("/api/offline/changes/synced", { changeIds });
    } catch (error: any) {
      console.error("Error marking changes as synced:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }
    }
  }

  // Clear synced changes
  async clearSyncedChanges(): Promise<void> {
    try {
      await apiClient.delete("/api/offline/changes/synced", {});
    } catch (error: any) {
      console.error("Error clearing synced changes:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }
    }
  }

  // Remove document from cache
  async removeDocumentFromCache(projectId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/offline/documents/${projectId}`, {});
    } catch (error: any) {
      console.error("Error removing document from cache:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }
    }
  }

  // Get offline settings
  async getUserOfflineSettings(): Promise<OfflineSettings> {
    try {
      const response = await apiClient.get("/api/offline/settings");
      console.log("Raw offline settings response:", response);
      const settings = response.data?.settings || {};
      console.log("Extracted settings:", settings);

      // Ensure we always return an object with default values
      const normalizedSettings = {
        enabled: true, // Default to enabled
        auto_sync: true,
        cache_size_limit: 100,
        sync_interval: 30,
        notify_on_sync_error: true,
        ...settings, // Override with actual values if they exist
      };

      console.log("Normalized settings:", normalizedSettings);
      return normalizedSettings;
    } catch (error: any) {
      console.error("Error fetching offline settings:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      // Return default settings on error
      return {
        enabled: true,
        auto_sync: true,
        cache_size_limit: 100,
        sync_interval: 30,
        notify_on_sync_error: true,
      } as OfflineSettings;
    }
  }

  // Update offline settings
  async updateUserOfflineSettings(
    settingsData: Partial<OfflineSettings>
  ): Promise<OfflineSettings> {
    try {
      const response = await apiClient.put(
        "/api/offline/settings",
        settingsData
      );
      return response.data?.settings || ({} as OfflineSettings);
    } catch (error: any) {
      console.error("Error updating offline settings:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return {} as OfflineSettings;
    }
  }

  // Get offline statistics
  async getOfflineStats(): Promise<any> {
    try {
      const response = await apiClient.get("/api/offline/stats");
      console.log("Raw offline stats response:", response);
      const stats = response.data?.stats || {};
      console.log("Extracted stats:", stats);
      return stats;
    } catch (error: any) {
      console.error("Error fetching offline stats:", error);

      // If it's an authentication error, redirect to login
      if (error.message && error.message.includes("Authentication required")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }

      return {};
    }
  }
}

const offlineService = new OfflineService();
export default offlineService;
