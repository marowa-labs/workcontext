import { apiClient } from "./apiClient";
import { getAuthToken } from "./auth";

interface ComplianceDataRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  reason?: string | null;
  data_description?: string;
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

interface DataProcessingAgreement {
  id: string;
  user_id: string;
  agreement_type: string;
  data_categories: string[];
  processing_purposes: string[];
  retention_period: number;
  third_parties: string[];
  security_measures: string[];
  consent_given: boolean;
  consent_date?: string;
  agreement_text?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

interface ComplianceAuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_id?: string;
  resource_type?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface DataBreachReport {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  severity: string;
  affected_users?: number;
  data_categories: string[];
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  notification_sent: boolean;
  regulatory_report: boolean;
  created_at: string;
  updated_at: string;
}

class ComplianceService {
  // Create a data request (access, portability, deletion, rectification)
  async createDataRequest(
    requestType: string,
    reason?: string,
    dataDescription?: string
  ): Promise<ComplianceDataRequest> {
    const response = await apiClient.post("/api/compliance/data-requests", {
      requestType,
      reason,
      dataDescription,
    });
    return response.data.request;
  }

  // Get data requests for the current user
  async getDataRequests(): Promise<ComplianceDataRequest[]> {
    try {
      console.log("Fetching compliance data requests");
      const response = await apiClient.get("/api/compliance/data-requests");
      console.log("Received compliance data requests response", response);

      // Handle case where no requests exist
      if (!response.data || response.data.success === false) {
        console.log("No data requests found or error in response");
        return [];
      }

      return response.data.requests || [];
    } catch (error) {
      console.error("Error fetching compliance data requests:", error);
      // Return empty array instead of throwing error to allow UI to handle gracefully
      return [];
    }
  }

  // Create or update data processing agreement
  async upsertDataProcessingAgreement(
    agreementData: Omit<
      DataProcessingAgreement,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ): Promise<DataProcessingAgreement> {
    const response = await apiClient.post(
      "/api/compliance/data-processing-agreement",
      agreementData
    );
    return response.data.agreement;
  }

  // Get data processing agreement for the current user
  async getDataProcessingAgreement(): Promise<DataProcessingAgreement | null> {
    try {
      console.log("Fetching data processing agreement");
      const response = await apiClient.get(
        "/api/compliance/data-processing-agreement"
      );
      console.log("Received data processing agreement response", response);

      // Handle case where no agreement exists (response.data.agreement will be null)
      if (!response.data || response.data.success === false) {
        console.log("No data processing agreement found or error in response");
        return null;
      }

      return response.data.agreement || null;
    } catch (error) {
      console.error("Error fetching data processing agreement:", error);
      // Return null instead of throwing error to allow UI to handle gracefully
      return null;
    }
  }

  // Get audit logs for the current user
  async getAuditLogs(): Promise<ComplianceAuditLog[]> {
    const response = await apiClient.get("/api/compliance/audit-logs");
    return response.data.logs;
  }

  // Export user data (for portability requests)
  async exportUserData(): Promise<Blob> {
    // We need to make a direct fetch request to get a blob response
    const token = await getAuthToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/compliance/export-data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  // Create data breach report
  async createDataBreachReport(
    title: string,
    description: string,
    severity: string,
    dataCategories: string[],
    affectedUsers?: number
  ): Promise<DataBreachReport> {
    const response = await apiClient.post(
      "/api/compliance/data-breach-reports",
      {
        title,
        description,
        severity,
        dataCategories,
        affectedUsers,
      }
    );
    return response.data.report;
  }
}

const complianceService = new ComplianceService();
export default complianceService;
