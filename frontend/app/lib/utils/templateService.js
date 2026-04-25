import { apiClient } from "./apiClient";

class TemplateService {
  // Get all templates (public or user's templates)
  static async getTemplates(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await apiClient.get(`/api/templates?${queryParams}`);
      return response.templates || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  // Get a specific template by ID
  static async getTemplateById(templateId) {
    try {
      const response = await apiClient.get(`/api/templates/${templateId}`);
      return response.template;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw error;
    }
  }

  // Create a new template
  static async createTemplate(templateData) {
    try {
      const response = await apiClient.post("/api/templates", templateData);
      return response.template;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }

  // Update a template
  static async updateTemplate(templateId, updateData) {
    try {
      const response = await apiClient.put("/api/templates", {
        id: templateId,
        ...updateData,
      });
      return response.template;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  }

  // Delete a template
  static async deleteTemplate(templateId) {
    try {
      await apiClient.delete(`/api/templates?id=${templateId}`);
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }

  // Get template by type
  static async getTemplateByType(type) {
    try {
      const response = await apiClient.get(`/api/templates/type/${type}`);
      return response.template;
    } catch (error) {
      console.error("Error fetching template by type:", error);
      throw error;
    }
  }
}

export default TemplateService;
