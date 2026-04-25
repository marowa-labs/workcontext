import { apiClient } from "./apiClient";

export interface UserSession {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  location: string | null;
  last_active: string;
  is_current: boolean;
  created_at: string;
  expires_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string;
  device_info: string;
  location: string | null;
  status: string;
  error_code: string | null;
  created_at: string;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: string;
  show_activity: boolean;
  show_location_in_document: boolean;
  search_indexing: boolean;
  share_analytics: boolean;
  share_crash_reports: boolean;
  third_party_cookies: boolean;
  document_privacy: string;
  auto_save: boolean;
  offline_mode: boolean;
  email_unusual_logins: boolean;
  notify_new_devices: boolean;
  created_at: string;
  updated_at: string;
}

class PrivacySettingsService {
  // Get user sessions
  static async getUserSessions(): Promise<UserSession[]> {
    try {
      const response = await apiClient.get("/api/sessions");
      // The backend returns the data directly, not wrapped in a data property
      return response;
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      throw error;
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<UserSession | null> {
    try {
      const response = await apiClient.get("/api/sessions/current");
      // The backend returns the data directly, not wrapped in a data property
      return response;
    } catch (error) {
      console.error("Error fetching current session:", error);
      throw error;
    }
  }

  // End a specific session
  static async endSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/sessions/${sessionId}`, {});
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  // Get login history
  static async getLoginHistory(): Promise<LoginHistory[]> {
    try {
      const response = await apiClient.get("/api/sessions/login-history");
      // The backend returns the data directly, not wrapped in a data property
      return response;
    } catch (error) {
      console.error("Error fetching login history:", error);
      throw error;
    }
  }

  // Get privacy settings
  static async getSettings(): Promise<PrivacySettings> {
    try {
      const response = await apiClient.get("/api/privacy/settings");
      // The backend returns { success: true, settings: PrivacySettings }
      return response.settings;
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      throw new Error("Failed to fetch privacy settings");
    }
  }

  // Update privacy settings
  static async updateSettings(
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      const response = await apiClient.post("/api/privacy/settings", settings);
      // The backend returns { success: true, settings: PrivacySettings }
      return response.settings;
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      throw new Error("Failed to update privacy settings");
    }
  }
}

export default PrivacySettingsService;
