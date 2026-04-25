import apiClient from "./apiClient";

export interface SearchAlert {
  id: string;
  query: string;
  frequency: "daily" | "weekly" | "monthly";
  created_at: string;
  last_checked: string;
  is_active: boolean;
  new_matches_count: number;
}

class SearchAlertService {
  static async getAlerts(): Promise<SearchAlert[]> {
    const data = await apiClient.get("/api/alerts");
    return data.alerts;
  }

  static async createAlert(
    query: string,
    frequency: "daily" | "weekly" | "monthly",
  ): Promise<SearchAlert> {
    const data = await apiClient.post("/api/alerts", { query, frequency });
    return data.alert;
  }

  static async deleteAlert(id: string): Promise<void> {
    await apiClient.delete(`/api/alerts/${id}`, {});
  }

  static async updateAlert(
    id: string,
    updates: Partial<SearchAlert>,
  ): Promise<SearchAlert> {
    const data = await apiClient.put(`/api/alerts/${id}`, updates);
    return data.alert;
  }

  static async checkAlert(
    id: string,
  ): Promise<{ alert: SearchAlert; results: any[] }> {
    const data = await apiClient.post(`/api/alerts/${id}/check`, {});
    return data;
  }
}

export default SearchAlertService;
