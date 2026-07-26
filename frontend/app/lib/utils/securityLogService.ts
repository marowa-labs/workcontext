import { apiClient } from "./apiClient";

export interface SecurityEvent {
  id: string;
  type:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "PASSWORD_CHANGED"
    | "EMAIL_CHANGED"
    | "DATA_EXPORT"
    | "ACCOUNT_DELETION_REQUEST"
    | "SESSION_ENDED";
  timestamp: string;
  ip_address: string;
  device_info: string;
  location: string | null;
  details: string | null;
}

export interface SecurityLogResponse {
  events: SecurityEvent[];
  total: number;
}

class SecurityLogService {
  static async getSecurityLog(
    limit = 50,
    offset = 0,
    type?: string,
  ): Promise<SecurityLogResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (type) params.set("type", type);
      const response = await apiClient.get(
        `/api/security-log?${params.toString()}`,
      );
      return response as SecurityLogResponse;
    } catch (error) {
      console.error("Error fetching security log:", error);
      throw error;
    }
  }
}

export default SecurityLogService;
